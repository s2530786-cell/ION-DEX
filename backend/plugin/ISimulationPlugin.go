package plugin

import (
	"context"
)

/**
 * @file simulation.go
 * @package pkg/ion/plugin
 * @description Core interface for the ION Pre-flight Simulation Engine.
 * Enables zero-risk sniping by executing transactions in a local fork
 * before broadcasting to the mainnet.
 */

// ISimulationPlugin defines the standard for transaction sandboxing.
type ISimulationPlugin interface {
	Plugin
	// Simulate executes a pre-check on a local node fork.
	// Returns detailed metrics on success, gas consumption, and potential profit/loss.
	Simulate(ctx context.Context, txData []byte) (SimulationResult, error)
}

// SimulationResult captures the output of the virtual execution.
type SimulationResult struct {
	Success      bool    `json:"success"`       // True if transaction did not revert
	GasUsed      uint64  `json:"gas_used"`      // Precise gas consumption for fee bidding
	Profit       float64 `json:"profit"`        // Estimated PnL after slippage and taxes
	NetBalance   string  `json:"balance_delta"` // BigInt representation of asset change
	RevertReason string  `json:"revert_reason"` // Captured error message if Success is false
}
