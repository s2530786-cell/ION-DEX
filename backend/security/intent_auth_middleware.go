package security

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/redis/go-redis/v9"
)

/**
 * @file intent_auth.go
 * @description Mission-critical ECDSA Signature Middleware for ION DEX.
 * Implements EIP-191 verification to anchor EVM user identity to TON execution.
 * Provides protection against:
 * 1. Unauthorized execution (Spoofing)
 * 2. Replay attacks (Nonce + Redis SETNX)
 * 3. Expired intents (Deadline check)
 * 4. Payload tampering (Hash consistency)
 */

type IntentPayload struct {
	UserAddress string `json:"userAddress"`
	TokenIn     string `json:"tokenIn"`
	TokenOut    string `json:"tokenOut"`
	AmountIn    string `json:"amountIn"`
	MinOut      string `json:"minOut"`
	Deadline    int64  `json:"deadline"`
	Nonce       string `json:"nonce"`
}

type ExecuteRequest struct {
	Intent    IntentPayload `json:"intent"`
	Signature string        `json:"signature"`
}

type AuthMiddleware struct {
	RedisClient *redis.Client
}

func NewAuthMiddleware(rdb *redis.Client) *AuthMiddleware {
	return &AuthMiddleware{RedisClient: rdb}
}

func (m *AuthMiddleware) VerifySignature(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read request body", http.StatusBadRequest)
			return
		}
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		var req ExecuteRequest
		if err := json.Unmarshal(bodyBytes, &req); err != nil {
			http.Error(w, "Invalid payload format", http.StatusBadRequest)
			return
		}

		// 1. Replay Protection: Atomic Nonce check via Redis
		nonceKey := fmt.Sprintf("nonce:%s:%s", req.Intent.UserAddress, req.Intent.Nonce)
		isNew, err := m.RedisClient.SetNX(r.Context(), nonceKey, "1", 10*time.Minute).Result()
		if err != nil || !isNew {
			http.Error(w, "Replay attack detected or invalid nonce", http.StatusUnauthorized)
			return
		}

		// 2. Freshness Protection: Deadline check
		if time.Now().Unix() > req.Intent.Deadline {
			http.Error(w, "Intent expired", http.StatusUnauthorized)
			return
		}

		// 3. Cryptographic Verification: EIP-191 Recovery
		intentBytes, _ := json.Marshal(req.Intent)
		if !verifyEVMMessage(string(intentBytes), req.Signature, req.Intent.UserAddress) {
			http.Error(w, "Cryptographic identity verification failed", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	}
}

func verifyEVMMessage(message, signatureHex, expectedAddress string) bool {
	sig, err := hexutil.Decode(signatureHex)
	if err != nil || len(sig) != 65 { return false }

	if sig[64] == 27 || sig[64] == 28 { sig[64] -= 27 }

	msgBytes := []byte(message)
	prefix := []byte(fmt.Sprintf("\x19Ethereum Signed Message:\n%d", len(msgBytes)))
	hash := crypto.Keccak256Hash(append(prefix, msgBytes...))

	sigPublicKeyECDSA, err := crypto.SigToPub(hash.Bytes(), sig)
	if err != nil { return false }

	recoveredAddress := crypto.PubkeyToAddress(*sigPublicKeyECDSA).Hex()
	return strings.EqualFold(recoveredAddress, expectedAddress)
}
