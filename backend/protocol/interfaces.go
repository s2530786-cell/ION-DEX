package protocol

import (
	"context"
	"math/big"
)

/**
 * @file interfaces.go
 * @package pkg/ion/protocol
 * @description Standardized interface definitions for the ION Protocol.
 * Enables decoupling of trading logic from UI and external integrations via gRPC.
 */

// ISniper defines the standardized sniping behavior.
// Any struct implementing this interface can serve as an ION-chain sniping driver.
type ISniper interface {
	// ExecuteSnipe initiates a transaction. Context handles timeouts; TradeRequest encapsulates all parameters.
	ExecuteSnipe(ctx context.Context, req TradeRequest) (txHash string, err error)
	
	// GetStatus retrieves the current engine status (latency, node connectivity, etc.).
	GetStatus(ctx context.Context) (EngineStatus, error)
}

// IRiskManager defines the standard risk defense line.
// Decouples risk logic from business flows to enable pluggable security management.
type IRiskManager interface {
	// ValidateTrade performs risk screening before a transaction is submitted.
	ValidateTrade(ctx context.Context, req TradeRequest) error
	
	// UpdateRiskMetrics receives real-time PnL data to drive circuit-breaker decisions.
	UpdateRiskMetrics(ctx context.Context, pnl float64) error
	
	// IsFrozen queries whether the system is currently in a frozen (circuit-broken) state.
	IsFrozen(ctx context.Context) bool
}

// TradeRequest standardizes trade intent for cross-module transmission.
type TradeRequest struct {
	PairAddress string   `json:"pair_addr"`
	Amount      *big.Int `json:"amount"`    // Precision nanoION
	Slippage    float64  `json:"slippage"`
	GasBribe    *big.Int `json:"gas_bribe"` // Priority fee
	UserNonce   int64    `json:"nonce"`
}

// EngineStatus defines unified monitoring metrics.
type EngineStatus struct {
	LatencyMs int64  `json:"latency_ms"`
	IsActive  bool   `json:"is_active"`
	NodeURL   string `json:"node_url"`
}

// UrgencyLevel represents trade execution priority.
type UrgencyLevel int

const (
	UrgencyNormal UrgencyLevel = iota
	UrgencyHigh
	UrgencyCritical
)
