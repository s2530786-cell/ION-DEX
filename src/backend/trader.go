package core

import (
	"context"
	"math/big"
)

/**
 * @file trader.go
 * @package pkg/ion/core
 * @description The foundational interface for the ION Protocol. 
 * Defines the standard behavior for sniper execution and risk validation 
 * to ensure cross-language and cross-chain compatibility.
 */

// ISniper defines the atomic trading operations required by the protocol.
type ISniper interface {
	// ExecuteSnipe processes high-frequency trade intents with millisecond-level precision.
	ExecuteSnipe(ctx context.Context, pair string, amount *big.Int, slippage float64) (txHash string, err error)
	
	// ValidateRisk acts as the protocol-level guardian, enforcing global loss limits and circuit breakers.
	ValidateRisk(ctx context.Context, tradeRequest TradeRequest) error
}

// IRiskManager defines the interface for dynamic safety fuses.
type IRiskManager interface {
	// CheckThresholds evaluates portfolio volatility and triggers automatic freezing if breached.
	CheckThresholds(ctx context.Context, userAddress string) (isSafe bool, error error)
}

// TradeRequest standardizes the input for all protocol-compliant clients.
type TradeRequest struct {
	UserAddress string   `json:"user_addr"`
	TokenPair   string   `json:"pair"`
	Amount      *big.Int `json:"amount"`
	Nonce       int64    `json:"nonce"`
	Deadline    int64    `json:"deadline"`
}
