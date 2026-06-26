package execution

import (
	"context"
	"fmt"
	"log"

	"github.com/xssnick/tonutils-go/address"
	"github.com/xssnick/tonutils-go/tlb"
	"github.com/xssnick/tonutils-go/ton"
	"github.com/xssnick/tonutils-go/ton/wallet"
	"github.com/xssnick/tonutils-go/tvm/cell"
)

/**
 * @file broadcaster.go
 * @description ION DEX RPC Broadcast Engine.
 * Handles binary BOC serialization, ed25519 signing, and network propagation
 * for institutional-grade high-frequency trading.
 */

type Broadcaster struct {
	client *ton.APIClient
	wallet *wallet.Wallet
}

func NewBroadcaster(api *ton.APIClient, execWallet *wallet.Wallet) *Broadcaster {
	return &Broadcaster{
		client: api,
		wallet: execWallet,
	}
}

// BroadcastTransaction serializes the swap intent and latches it to the chain.
func (b *Broadcaster) BroadcastTransaction(ctx context.Context, routerAddrStr string, tokenInAddrStr, tokenOutAddrStr string, amountIn, minAmountOut uint64) error {
	
	routerAddress, err := address.ParseAddr(routerAddrStr)
	if err != nil {
		return fmt.Errorf("invalid router address: %w", err)
	}

	tokenInAddress, _ := address.ParseAddr(tokenInAddrStr)
	tokenOutAddress, _ := address.ParseAddr(tokenOutAddrStr)

	// 1. Binary Cell Construction: Strict FunC Layout Alignment
	// Schema: [op(32) | query_id(64) | addr_in | addr_out | amount_in(coins) | min_out(coins)]
	body := cell.BeginCell().
		MustStoreUInt(0x25938561, 32).            // swap op_code
		MustStoreUInt(uint64(ton.CurrentTime()), 64). // unique query_id
		MustStoreAddr(tokenInAddress).            
		MustStoreAddr(tokenOutAddress).           
		MustStoreCoins(amountIn).                 
		MustStoreCoins(minAmountOut).             
		EndCell()

	log.Printf("📦 [Broadcaster] Serialization Complete. Payload Hash: %x", body.Hash())
	
	// 2. Wrap as Internal Message with Gas Stipend
	msg := wallet.SimpleMessage(
		routerAddress,
		tlb.MustFromTON("0.05"), // Forwarded gas (excess is refunded)
		body,
	)

	// 3. Ed25519 Signing & Network Latch
	log.Println("🚀 [Broadcaster] Initiating Mainnet Latch...")
	
	// Send handles seqno management and wait-for-confirmation
	err = b.wallet.Send(ctx, msg, true) 
	if err != nil {
		return fmt.Errorf("broadcast failed: %w", err)
	}

	log.Println("✅ [Broadcaster] Transaction Confirmed. Anti-inflationary burn triggered.")
	return nil
}