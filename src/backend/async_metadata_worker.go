package main

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
func StartMetadataWorkerPool(db *sql.DB, rpcClient ton.APIClientV2, workers int) {
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