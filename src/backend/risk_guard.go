package risk

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/your-project/pkg/ion/protocol"
)

/**
 * @file risk_guard.go
 * @description Standard implementation of the IRiskManager interface.
 * Implements a high-performance rule engine to intercept malicious or 
 * high-volatility trades before they are latched to the chain.
 */

type RiskGuard struct {
	mu           sync.RWMutex
	isFrozen     bool
	maxLossLimit float64 // e.g., 0.20 for 20%
	currentPnL   float64
}

func NewRiskGuard(lossLimit float64) *RiskGuard {
	return &RiskGuard{
		maxLossLimit: lossLimit,
		isFrozen:     false,
	}
}

// ValidateTrade acts as the protocol-level guardian.
func (g *RiskGuard) ValidateTrade(ctx context.Context, req protocol.TradeRequest) error {
	g.mu.RLock()
	defer g.mu.RUnlock()

	// 1. Check Circuit Breaker status
	if g.isFrozen {
		return errors.New("PROTOCOL_FROZEN: Circuit breaker active due to extreme volatility")
	}

	// 2. Slippage Defense
	if req.Slippage > 0.05 { // Hard limit 5% for institutional safety
		return fmt.Errorf("RISK_EXCEEDED: Requested slippage %.2f%% exceeds protocol safety bound", req.Slippage*100)
	}

	// 3. Concentration Check (Placeholder for liquidity depth validation)
	// if req.Amount > poolDepth * 0.1 { return errors.New("PRICE_IMPACT_TOO_HIGH") }

	return nil
}

// UpdateRiskMetrics receives real-time PnL to drive the circuit breaker.
func (g *RiskGuard) UpdateRiskMetrics(ctx context.Context, pnl float64) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.currentPnL = pnl

	// Trigger Circuit Breaker if loss exceeds threshold
	if g.currentPnL <= -g.maxLossLimit {
		g.isFrozen = true
		// In production, this would also trigger a Redis pub/sub alert
		return errors.New("CRITICAL_LOSS_DETECTED: System frozen")
	}

	return nil
}

func (g *RiskGuard) IsFrozen(ctx context.Context) bool {
	g.mu.RLock()
	defer g.mu.RUnlock()
	return g.isFrozen
}
