package risk

import (
	"fmt"
	"sync"
	"sync/atomic"
)

/**
 * @file guard.go
 * @description Global Risk Kill-Switch (Circuit Breaker).
 * Implements atomic state management to instantaneously block all on-chain 
 * paths when safety thresholds (consecutive errors or max loss) are breached.
 */

type Guard struct {
	mu           sync.RWMutex
	paused       atomic.Bool
	errorCounter atomic.Int64
	maxErrors    int64
	maxLoss      float64
	currentLoss  atomic.Value // stores float64
}

func NewGuard(maxErrors int64, maxLoss float64) *Guard {
	g := &Guard{maxErrors: maxErrors, maxLoss: maxLoss}
	g.currentLoss.Store(0.0)
	return g
}

// CanExecute is the mandatory checkpoint before any SniperEngine transaction.
func (g *Guard) CanExecute() error {
	if g.paused.Load() {
		return fmt.Errorf("⛔ RISK_GUARD: System paused due to safety thresholds")
	}
	return nil
}

// ReportError increments the failure counter; triggers the kill-switch if threshold is hit.
func (g *Guard) ReportError() {
	count := g.errorCounter.Add(1)
	if count >= g.maxErrors {
		g.paused.Store(true)
		fmt.Printf("⚠️ CRITICAL: Error threshold reached (%d), system kill-switched!\n", count)
	}
}

// RecordLoss updates the cumulative PnL; triggers emergency stop if max loss is exceeded.
func (g *Guard) RecordLoss(amount float64) {
	// Atomic update for float64 requires load/store cycle
	current := g.currentLoss.Load().(float64)
	newLoss := current + amount
	g.currentLoss.Store(newLoss)
	
	if newLoss >= g.maxLoss {
		g.paused.Store(true)
		fmt.Printf("⚠️ CRITICAL: Max loss exceeded ($%.2f), emergency stop!\n", newLoss)
	}
}

// Reset clears the circuit breaker (manual admin intervention required in production).
func (g *Guard) Reset() {
	g.paused.Store(false)
	g.errorCounter.Store(0)
	g.currentLoss.Store(0.0)
}
