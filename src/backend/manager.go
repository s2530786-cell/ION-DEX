package execution

import (
	"context"
	"fmt"
	"sync"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/go-redis/redis/v8"
)

/**
 * @file nonce_manager.go
 * @description Distributed atomic nonce management for high-concurrency sniping.
 * Prevents "Nonce too low" errors across multiple engine instances via Redis INCR.
 */

type NonceManager struct {
	rdb       *redis.Client
	client    *ethclient.Client
	address   common.Address
	nonceKey  string
	mu        sync.Mutex // Local lock for process-level safety
}

func NewNonceManager(rdb *redis.Client, client *ethclient.Client, addr common.Address) *NonceManager {
	return &NonceManager{
		rdb:      rdb,
		client:   client,
		address:  addr,
		nonceKey: fmt.Sprintf("nonce:%s", addr.Hex()),
	}
}

// GetNextNonce retrieves the next available nonce using atomic Redis increment.
func (nm *NonceManager) GetNextNonce(ctx context.Context) (uint64, error) {
	nm.mu.Lock()
	defer nm.mu.Unlock()

	// 1. Initial Sync: Force pull from chain if Redis key is missing
	exists, err := nm.rdb.Exists(ctx, nm.nonceKey).Result()
	if err != nil {
		return 0, fmt.Errorf("redis check failed: %w", err)
	}
	if exists == 0 {
		if err := nm.SyncNonce(ctx); err != nil {
			return 0, err
		}
	}

	// 2. Atomic Increment: Ensures mutual exclusivity across distributed instances
	nonce, err := nm.rdb.Incr(ctx, nm.nonceKey).Result()
	if err != nil {
		// Fallback: If Redis is down, query the chain directly (higher latency)
		return nm.client.PendingNonceAt(ctx, nm.address)
	}

	// Redis INCR returns value AFTER increment; we return current available (val - 1)
	return uint64(nonce - 1), nil
}

// SyncNonce reconciles the Redis counter with the actual on-chain pending nonce.
func (nm *NonceManager) SyncNonce(ctx context.Context) error {
	chainNonce, err := nm.client.PendingNonceAt(ctx, nm.address)
	if err != nil {
		return fmt.Errorf("failed to fetch chain nonce: %w", err)
	}

	// Reset Redis counter to current chain truth
	_, err = nm.rdb.Set(ctx, nm.nonceKey, chainNonce, 0).Result()
	return err
}
