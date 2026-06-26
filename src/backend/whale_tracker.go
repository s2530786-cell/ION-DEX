package intelligence

import (
	"context"
	"math/big"
	"time"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/go-redis/redis/v8"
)

/**
 * @file whale_tracker.go
 * @description High-performance on-chain "Deep Sea" whale monitoring service.
 * Intercepts large-scale asset transfers in real-time to generate Alpha signals.
 */

type WhaleScanner struct {
	Rdb       *redis.Client
	Threshold *big.Int // Threshold in nanoION/Wei (e.g., 500,000 USDT equivalent)
}

func (ws *WhaleScanner) OnTransaction(ctx context.Context, tx *types.Transaction, amount *big.Int) {
	// P0 Performance: O(1) comparison for immediate discard of sub-threshold noise
	if amount.Cmp(ws.Threshold) < 0 {
		return
	}

	// Alpha Intelligence: Latching the signal to the Redis Stream for downstream execution
	signal := map[string]interface{}{
		"type":   "WHALE_ALERT",
		"amount": amount.String(),
		"to":     tx.To().Hex(),
		"time":   time.Now().Unix(),
		"hash":   tx.Hash().Hex(),
	}

	ws.Rdb.XAdd(ctx, &redis.XAddArgs{
		Stream: "stream:intelligence",
		Values: signal,
	}).Result()
}
