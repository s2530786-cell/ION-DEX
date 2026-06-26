package flow

import (
	"fmt"
	"math/big"
)

/**
 * @file validator.go
 * @description ION-Flow Pipeline Guardrails.
 * Implements the Decorator Pattern to wrap execution steps with mandatory 
 * pre- and post-flight data integrity checks.
 */

// Validator defines the contract for data integrity checks.
type Validator func(data map[string]interface{}) error

// ValidatedStep wraps an IONFlowStep with specific validators.
type ValidatedStep struct {
	Step      IONFlowStep
	Validator Validator
}

// Execute performs the decorated execution cycle: Validate -> Run -> Validate.
func (vs *ValidatedStep) Execute(pCtx *PipelineContext, params map[string]interface{}) error {
	// 1. Pre-execution: Guard against poisoned inputs
	if err := vs.Validator(pCtx.Data); err != nil {
		return fmt.Errorf("PRE-FLIGHT VALIDATION FAILED: %w", err)
	}

	// 2. Core Execution: Run the underlying plugin logic
	if err := vs.Step.Execute(pCtx, params); err != nil {
		return err
	}

	// 3. Post-execution: Sanitize outputs before the next hop
	if err := vs.Validator(pCtx.Data); err != nil {
		return fmt.Errorf("POST-FLIGHT INTEGRITY BREACH: %w", err)
	}

	return nil
}

// Common Domain Validators
func AmountValidator(data map[string]interface{}) error {
    val, ok := data["output_amount"].(*big.Int)
    if !ok { return nil } // Skip if amount is not part of this context
    if val.Sign() <= 0 {
        return fmt.Errorf("invalid financial value: %s (non-positive result)", val.String())
    }
    return nil
}

func GasValidator(data map[string]interface{}) error {
    gas, ok := data["estimated_gas"].(uint64)
    if !ok { return nil }
    if gas > 500000 { // Hard cap for safety
        return fmt.Errorf("gas estimation too high: %d (potential honeypot or inefficient route)", gas)
    }
    return nil
}
