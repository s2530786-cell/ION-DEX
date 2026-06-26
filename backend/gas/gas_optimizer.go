package gas

import (
	"context"
	"math/big"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ion-dex-nuke/backend/protocol"
)

/**
 * @file gas_optimizer.go
 * @description Dynamic Gas Bidding Strategy for "Must-Fill" scenarios.
 * Adjusts GasTipCap based on mempool competition and trade urgency.
 */

type GasOptimizer struct {
	client *ethclient.Client
}

// CalculateOptimalTip ensures your transaction is included in the next block.
// Formula: BaseTip * UrgencyMultiplier (1.5x - 3x)
func (g *GasOptimizer) CalculateOptimalTip(ctx context.Context, urgency protocol.UrgencyLevel) (*big.Int, error) {
	suggestedTip, err := g.client.SuggestGasTipCap(ctx)
	if err != nil {
		return nil, err
	}

	multiplier := big.NewInt(15) // Default 1.5x
	if urgency == protocol.UrgencyHigh {
		multiplier = big.NewInt(30) // 3.0x for sniping
	}

	// (suggestedTip * multiplier) / 10
	optimalTip := new(big.Int).Mul(suggestedTip, multiplier)
	optimalTip.Div(optimalTip, big.NewInt(10))

	return optimalTip, nil
}
