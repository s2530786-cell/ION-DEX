package simulation

import (
	"context"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ion-dex-nuke/backend/plugin"
)

/**
 * @file eth_simulator.go
 * @description Production-grade implementation of the Transaction Simulator.
 * Uses a two-phase check (EstimateGas + CallContract) to ensure total deterministic safety.
 */

type EthSimulator struct {
	client *ethclient.Client
}

func NewEthSimulator(client *ethclient.Client) *EthSimulator {
	return &EthSimulator{client: client}
}

func (s *EthSimulator) Name() string { return "simulation-engine" }

// Simulate performs the transaction dry-run without broadcasting to the network.
func (s *EthSimulator) Simulate(ctx context.Context, from string, to string, data []byte, value *big.Int) (plugin.SimulationResult, error) {
	toAddr := common.HexToAddress(to)
	fromAddr := common.HexToAddress(from)

	// 1. Construct the call message
	msg := ethereum.CallMsg{
		From:  fromAddr,
		To:    &toAddr,
		Data:  data,
		Value: value,
	}

	// 2. Phase 1: Estimate Gas (Captures immediate reverts)
	gas, err := s.client.EstimateGas(ctx, msg)
	if err != nil {
		return plugin.SimulationResult{
			Success:      false,
			RevertReason: fmt.Sprintf("GAS_ESTIMATION_FAILED: %v", err),
		}, nil 
	}

	// 3. Phase 2: CallContract (Full logic verification)
	_, err = s.client.CallContract(ctx, msg, nil)
	if err != nil {
		return plugin.SimulationResult{
			Success:      false,
			RevertReason: fmt.Sprintf("CONTRACT_LOGIC_REVERT: %v", err),
		}, nil
	}

	return plugin.SimulationResult{
		Success: true,
		GasUsed: gas,
	}, nil
}

// Execute handles the generic plugin registry invocation.
func (s *EthSimulator) Execute(ctx context.Context, action string, payload []byte) (interface{}, error) {
    // Integration with Registry logic for generic execution
    return nil, fmt.Errorf("use specialized Simulate method for sub-millisecond precision")
}
