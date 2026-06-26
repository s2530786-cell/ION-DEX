package plugin

import (
	"context"
	"math/big"
)

/**
 * @file simulation.go
 * @package pkg/ion/plugin
 * @description Standard interface for the ION Pre-flight Simulation Engine.
 * Enforces a two-stage verification (EstimateGas + CallContract) for zero-risk sniping.
 */

// SimulationResult encapsulates the virtual execution outcome.
type SimulationResult struct {
	Success      bool   `json:"success"`
	GasUsed      uint64 `json:"gas_used"`
	RevertReason string `json:"revert_reason,omitempty"`
}

// ISimulationPlugin defines the contract for rigorous transaction sandboxing.
type ISimulationPlugin interface {
	Plugin
	// Simulate executes a pre-check on a local node fork.
	Simulate(ctx context.Context, from string, to string, data []byte, value *big.Int) (SimulationResult, error)
}
