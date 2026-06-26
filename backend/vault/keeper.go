package vault

import (
	"context"
	"database/sql"
	"log"
	"time"

	"github.com/xssnick/tonutils-go/address"
	"github.com/xssnick/tonutils-go/tlb"
	"github.com/xssnick/tonutils-go/ton"
	"github.com/xssnick/tonutils-go/ton/wallet"
	"github.com/xssnick/tonutils-go/tvm/cell"
)

/**
 * @file keeper.go
 * @description ION DEX Hybrid Keeper Engine.
 * Bridges Intent-based off-chain orders with the on-chain DEX Vault.
 */

type LimitOrder struct {
	ID           int
	UserPubkey   []byte
	TokenAddress string
	AmountIn     uint64
	MinOut       uint64
	Expiration   int64
	Nonce        int64
	Signature    []byte
}

func StartKeeperBot(db *sql.DB, client *ton.APIClient, keeperWallet *wallet.Wallet) {
	log.Println("🚀 Keeper Engine Active: Monitoring Intent-based Orders...")

	for {
		// 1. Poll for executable orders (Price match logic assumed in SQL view)
		rows, err := db.Query(`
			SELECT id, user_pubkey, token_address, amount_in, min_out, expiration, nonce, signature 
			FROM limit_orders 
			WHERE status = 'pending' 
			AND expiration > EXTRACT(EPOCH FROM NOW())
		`)
		if err != nil {
			time.Sleep(1 * time.Second)
			continue
		}

		for rows.Next() {
			var o LimitOrder
			err := rows.Scan(&o.ID, &o.UserPubkey, &o.TokenAddress, &o.AmountIn, &o.MinOut, &o.Expiration, &o.Nonce, &o.Signature)
			if err != nil { continue }

			// 2. Reconstruct TVM Cell for on-chain verification
			payload := cell.BeginCell().
				MustStoreUInt(uint64(time.Now().Unix()), 256). // Simplified pubkey handle
				MustStoreAddr(address.MustParseAddr(o.TokenAddress)).
				MustStoreCoins(o.AmountIn).
				MustStoreCoins(o.MinOut).
				MustStoreUInt(uint64(o.Expiration), 64).
				MustStoreUInt(uint64(o.Nonce), 64).
				EndCell()

			executionBody := cell.BeginCell().
				MustStoreUInt(0x4c494d54, 32). // op::execute_limit_order
				MustStoreSlice(o.Signature, 512).
				MustStoreRef(payload).
				EndCell()

			// 3. Concurrent Execution
			go func(orderID int, body *cell.Cell) {
				log.Printf("Matching Order %d... Dispatching to Vault.", orderID)
				
				msg := wallet.SimpleMessage(
					address.MustParseAddr("ION_VAULT_ADDRESS"),
					tlb.MustFromTON("0.05"), // Fronted Gas
					body,
				)

				if err := keeperWallet.Send(context.Background(), msg, true); err != nil {
					log.Printf("Execution Failed [%d]: %v", orderID, err)
					return
				}

				db.Exec("UPDATE limit_orders SET status = 'settled' WHERE id = $1", orderID)
			}(o.ID, executionBody)
		}
		rows.Close()
		time.Sleep(500 * time.Millisecond)
	}
}