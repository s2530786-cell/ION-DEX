/**
 * @file market_broadcaster.go
 * @description High-performance Redis Pub/Sub broadcaster for ION DEX.
 * Bridges the Order Matching Engine with the WebSocket Gateway.
 */

package infrastructure

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/go-redis/redis/v8"
	"log"
)

var ctx = context.Background()

type MarketUpdate struct {
	Type      string      `json:"type"`      // "ORDERBOOK_UPDATE" | "TRADE_EVENT"
	Symbol    string      `json:"symbol"`    // e.g., "ION/USDC"
	Sequence  int64       `json:"seq"`       // Monotonic Sequence ID
	Payload   interface{} `json:"payload"`
}

func BroadcastUpdate(rdb *redis.Client, channel string, update MarketUpdate) error {
	// 1. Serialize update to JSON
	data, err := json.Marshal(update)
	if err != nil {
		return fmt.Errorf("marshal error: %v", err)
	}

	// 2. Publish to Redis channel
	// All connected WebSocket Gateway instances subscribe to this
	err = rdb.Publish(ctx, channel, data).Err()
	if err != nil {
		return fmt.Errorf("redis publish error: %v", err)
	}

	log.Printf("[Broadcaster] Latched seq %d to channel %s", update.Sequence, channel)
	return nil
}

// Example: Broadcasting a processed OrderBook snapshot from the Matcher
func OnOrderMatched(rdb *redis.Client, symbol string, bids, asks interface{}, seq int64) {
	update := MarketUpdate{
		Type:     "ORDERBOOK_UPDATE",
		Symbol:   symbol,
		Sequence: seq,
		Payload: map[string]interface{}{
			"bids": bids,
			"asks": asks,
		},
	}
	BroadcastUpdate(rdb, "market_updates:"+symbol, update)
}