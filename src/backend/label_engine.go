package intelligence

import (
	"context"
	"encoding/json"
	"sync"

	"github.com/go-redis/redis/v8"
)

/**
 * @file label_engine.go
 * @description High-performance Address Labeling Engine for ION DEX.
 * Implements a dual-layer caching strategy: sync.RWMutex for hot memory access (L1) 
 * and Redis Hash for distributed persistence (L2).
 */

type AddressLabel struct {
	Tag       string  `json:"tag"`       // "SMART_MONEY", "WHALE", "RETAIL_TRADER"
	WinRate   float64 `json:"win_rate"`  // Percentage of profitable trades
	RiskScore int     `json:"risk_score"` // 0-100 calculated risk
}

type LabelEngine struct {
	rdb   *redis.Client
	mu    sync.RWMutex
	cache map[string]AddressLabel
}

func NewLabelEngine(rdb *redis.Client) *LabelEngine {
	return &LabelEngine{
		rdb:   rdb,
		cache: make(map[string]AddressLabel),
	}
}

// GetLabel retrieves the identity of an address.
// Checks L1 (Local Cache) first for O(1) performance, then falls back to L2 (Redis).
func (e *LabelEngine) GetLabel(ctx context.Context, address string) (AddressLabel, error) {
	// 1. L1 Local Cache Read (Shared RLock)
	e.mu.RLock()
	if label, ok := e.cache[address]; ok {
		e.mu.RUnlock()
		return label, nil
	}
	e.mu.RUnlock()

	// 2. L2 Redis Read Fallback
	val, err := e.rdb.HGet(ctx, "labels:address", address).Result()
	if err != nil {
		return AddressLabel{}, err
	}

	var label AddressLabel
	if err := json.Unmarshal([]byte(val), &label); err != nil {
		return AddressLabel{}, err
	}

	// 3. Update L1 Cache (Exclusive Lock)
	e.mu.Lock()
	e.cache[address] = label
	e.mu.Unlock()

	return label, nil
}
