package worker

import (
	"context"
	"database/sql"
	"log"

	"github.com/xssnick/tonutils-go/ton"
)

/**
 * @file async_metadata_worker.go
 * @description Golang High-Concurrency Metadata Bypass.
 * Implements a buffered task queue and worker pool to handle out-of-band 
 * metadata resolution without blocking the critical block-sync pipeline.
 */

// Buffered channel for bypass tasks (Side-car Pattern)
var metadataTaskQueue = make(chan string, 1000)

// StartMetadataWorkerPool initializes the background resolution cluster.
func StartMetadataWorkerPool(db *sql.DB, rpcClient *ton.APIClient, workers int) {
	log.Printf("🚀 Metadata Worker Pool Active: %d workers deployed", workers)
	for i := 0; i < workers; i++ {
		go func(workerID int) {
			for tokenAddrStr := range metadataTaskQueue {
				// Perform silent background resolution
				err := FetchAndRegisterJetton(context.Background(), db, rpcClient, tokenAddrStr)
				if err != nil {
					log.Printf("⚠️ [Worker %d] Resolution failed for %s: %v", workerID, tokenAddrStr, err)
				} else {
					log.Printf("✅ [Worker %d] Metadata latched for %s", workerID, tokenAddrStr)
				}
			}
		}(i)
	}
}

// FetchAndRegisterJetton resolves token metadata from chain and stores in DB.
func FetchAndRegisterJetton(ctx context.Context, db *sql.DB, client *ton.APIClient, tokenAddr string) error {
	// TODO: Implement on-chain jetton metadata resolution via tonutils-go
	// For now, store a placeholder to unblock compilation
	_, err := db.ExecContext(ctx,
		`INSERT INTO token_metadata (address, name, symbol, decimals, updated_at)
		 VALUES ($1, $2, $3, $4, NOW())
		 ON CONFLICT (address) DO UPDATE SET updated_at = NOW()`,
		tokenAddr, tokenAddr[:8], "???", 9,
	)
	return err
}

// DispatchMetadataTask pushes a token address to the bypass queue.
func DispatchMetadataTask(tokenAddr string) {
	select {
	case metadataTaskQueue <- tokenAddr:
		// Task queued successfully
	default:
		// Queue saturated: system prioritizes block sync over metadata
		log.Println("❌ [CRITICAL] Metadata queue overflow! Dropping bypass task.")
	}
}