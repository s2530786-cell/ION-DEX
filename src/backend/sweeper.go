package worker

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

/**
 * @file sweeper.go
 * @description P1 Auto-Sweep Daemon for ION DEX.
 * Implements an automated profit-recovery loop that migrates excess capital 
 * from hot execution wallets to secure cold storage, with built-in 
 * gas-retention and ROI-based filtering.
 */

type Sweeper struct {
	mu           *sync.Mutex      // Shared mutex with SniperEngine to prevent Nonce collisions
	client       *ethclient.Client
	hotKey       *ecdsa.PrivateKey
	hotAddress   common.Address
	coldAddress  common.Address
	threshold    *big.Int // Minimum excess balance to trigger sweep (nanoION)
	minRetention *big.Int // Mandatory gas reserve for next sniper trades
}

func NewSweeper(client *ethclient.Client, hotKey *ecdsa.PrivateKey, coldAddr string, threshold, retention *big.Int, sharedMu *sync.Mutex) *Sweeper {
	publicKey := hotKey.Public().(*ecdsa.PublicKey)
	return &Sweeper{
		mu:           sharedMu,
		client:       client,
		hotKey:       hotKey,
		hotAddress:   crypto.PubkeyToAddress(*publicKey),
		coldAddress:  common.HexToAddress(coldAddr),
		threshold:    threshold,
		minRetention: retention,
	}
}

// Start initiates the background monitoring loop.
func (s *Sweeper) Start(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.runSweep(ctx)
		case <-ctx.Done():
			return
		}
	}
}

func (s *Sweeper) runSweep(ctx context.Context) {
	// P0 Concurrency Protection: Avoid Nonce conflict with active trades
	s.mu.Lock()
	defer s.mu.Unlock()

	// 1. Snapshot Balance
	balance, err := s.client.BalanceAt(ctx, s.hotAddress, nil)
	if err != nil {
		return
	}

	// 2. Trigger Logic: Balance > Threshold + Retention
	triggerPoint := new(big.Int).Add(s.threshold, s.minRetention)
	if balance.Cmp(triggerPoint) <= 0 {
		return
	}

	// 3. Dynamic Gas Estimation (L1 Protection)
	gasPrice, err := s.client.SuggestGasPrice(ctx)
	if err != nil {
		return
	}
	
	const gasLimit uint64 = 21000 // Standard Transfer
	totalGasCost := new(big.Int).Mul(gasPrice, big.NewInt(int64(gasLimit)))

	// 4. Calculate Net Transfer
	// transferAmount = balance - retention - gasCost
	transferAmount := new(big.Int).Sub(balance, s.minRetention)
	transferAmount.Sub(transferAmount, totalGasCost)

	if transferAmount.Sign() <= 0 {
		return
	}

	// 5. ROI Filter: Prevent "Dust-Sweeping" where gas eats > 5% of profit
	// Formula: GasCost / TransferAmount > 0.05
	costRatio := new(big.Float).Quo(
		new(big.Float).SetInt(totalGasCost),
		new(big.Float).SetInt(transferAmount),
	)
	
	ratioVal, _ := costRatio.Float64()
	if ratioVal > 0.05 {
		fmt.Printf("⚠️ [SWEEPER] Skip: Gas cost too high (%.2f%% of sweep)\n", ratioVal*100)
		return
	}

	// 6. Execute Transaction
	nonce, err := s.client.PendingNonceAt(ctx, s.hotAddress)
	if err != nil {
		return
	}

	tx := types.NewTransaction(nonce, s.coldAddress, transferAmount, gasLimit, gasPrice, nil)
	signedTx, err := types.SignTx(tx, types.LatestSignerForChainID(big.NewInt(1)), s.hotKey)
	if err != nil {
		return
	}

	err = s.client.SendTransaction(ctx, signedTx)
	if err == nil {
		fmt.Printf("✅ [SWEEPER] Recovered %s nanoION to Cold Storage\n", transferAmount.String())
	}
}
