package router

import (
	"context"
	"fmt"
	"math/big"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

/**
 * @file adapter_test.go
 * @description ION DEX Adapter Health Check & RPC Telemetry Probe.
 * Verifies the integrity of the UniV2 contract bindings and measures 
 * real-world RTT (Round Trip Time) for institutional sniping.
 */

func TestUniV2AdapterConnectivity(t *testing.T) {
	// 1. Initialize Client (Production-Grade ION RPC)
	client, err := ethclient.Dial("https://rpc.ion.network")
	if err != nil {
		t.Fatalf("❌ Failed to connect to RPC: %v", err)
	}

	// 2. Initialize Adapter (Using ION Mainnet Router Address)
	// Placeholder: 0x... should be replaced with ION Mainnet Router.fc address
	adapter := sources.NewUniV2Source(client, "0x8ff2e1210434495c4f5629bd9d8bd4965a67b84c", "univ2_test")

	// 3. Execute Health Check
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	// Input: 1.0 ION (9 decimals precision nanoION)
	amountIn := big.NewInt(1000000000) 
	
	fmt.Println("🔍 Probing liquidity source for real-time quotes...")
	start := time.Now()
	quote, err := adapter.GetQuote(ctx, amountIn)
	duration := time.Since(start)

	// 4. Diagnostic Result
	if err != nil {
		t.Errorf("❌ Quote fetch failed: %v", err)
		return
	}

	fmt.Printf("✅ Health Check Passed:\n")
	fmt.Printf("   - Latency (RTT): %v\n", duration)
	fmt.Printf("   - Projected Output (Quote): %s\n", quote.String())
	
	// Sniper Benchmark: Sub-500ms is the entry barrier for institutional speed
	if duration > 500*time.Millisecond {
		fmt.Println("⚠️ WARNING: High latency detected. Optimize RPC node provider quality.")
	} else {
		fmt.Println("🚀 LATENCY EXCELLENT: Ready for high-frequency routing decisions.")
	}
}
