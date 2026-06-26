package plugin

import (
	"context"
	"fmt"
	"math/big"
)

/**
 * @file types.go
 * @package plugin
 * @description ION Plugin system core types for routing, liquidity, and execution.
 */

// LiquiditySource represents a DEX or liquidity pool that can fulfill swaps.
type LiquiditySource struct {
	Name     string                 `json:"name"`
	Address  string                 `json:"address"`
	ChainID  int64                  `json:"chain_id"`
	Tokens   []string               `json:"tokens"`
	Fee      float64                `json:"fee"`
	Active   bool                   `json:"active"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// ID returns the unique identifier for this liquidity source.
func (s LiquiditySource) ID() string {
	return fmt.Sprintf("%s:%s:%d", s.Name, s.Address, s.ChainID)
}

// GetQuote returns the expected output amount for a given input.
func (s LiquiditySource) GetQuote(ctx context.Context, amount *big.Int) (*big.Int, error) {
	// TODO: Implement actual on-chain quote via RPC
	return new(big.Int).Set(amount), nil
}

// ExecutionStep is a single step in an execution plan (router-compatible).
type ExecutionStep struct {
	SourceID    string   `json:"source_id"`
	InputAmount *big.Int `json:"input_amount"`
}

// ExecutionPlan describes an optimal route through liquidity sources.
type ExecutionPlan struct {
	Steps       []RouteStep     `json:"steps"`
	TotalGas    uint64          `json:"total_gas"`
	ExpectedOut *big.Int        `json:"expected_out"`
	MinOut      *big.Int        `json:"min_out"`
	Deadline    uint64          `json:"deadline"`
	TotalOutput *big.Int        `json:"total_output"`
	Slippage    float64         `json:"slippage"`
}

// RouteStep is a single hop in an execution plan.
type RouteStep struct {
	Source      LiquiditySource `json:"source"`
	TokenIn     string          `json:"token_in"`
	TokenOut    string          `json:"token_out"`
	AmountIn    *big.Int        `json:"amount_in"`
	MinOut      *big.Int        `json:"min_out"`
	GasEstimate uint64          `json:"gas_estimate"`
}

// IonPlugin extends the base Plugin interface for ION-specific functionality.
type IonPlugin interface {
	Plugin
	// Validate checks whether this plugin can handle a given token pair.
	Validate(ctx context.Context, tokenIn, tokenOut string) (bool, error)
	// GetQuote returns the expected output for a given input amount.
	GetQuote(ctx context.Context, tokenIn, tokenOut string, amountIn *big.Int) (*big.Int, error)
	// Process executes a pipeline step with the given input data.
	Process(ctx context.Context, input []byte) ([]byte, error)
}
