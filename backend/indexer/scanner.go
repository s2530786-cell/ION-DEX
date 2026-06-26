package indexer

import (
	"context"
	"log"
	"time"

	"github.com/xssnick/tonutils-go/address"
	"github.com/xssnick/tonutils-go/ton"
)

/**
 * @file scanner.go
 * @description ION DEX Real-time Event Indexer (The Tactical Eye).
 * Transitions the system from active polling to passive block-listening.
 * Maintains a local memory cache of pool reserves for < 1ms strategy execution.
 */

// SniperEngine is the interface for sniping execution callbacks.
type SniperEngine interface {
	Execute(ctx context.Context, txHash string) error
	UpdateLocalReserves(reserveIn, reserveOut uint64)
}

type BlockScanner struct {
	client       *ton.APIClient
	targetRouter *address.Address
	engine       SniperEngine
}

func NewBlockScanner(api *ton.APIClient, routerAddr string, engine SniperEngine) *BlockScanner {
	addr, _ := address.ParseAddr(routerAddr)
	return &BlockScanner{
		client:       api,
		targetRouter: addr,
		engine:       engine,
	}
}

// Start initiates the background daemon to monitor the ION masterchain.
func (s *BlockScanner) Start(ctx context.Context) {
	log.Printf("📡 [Indexer] Starting block listener for router: %s", s.targetRouter.String())

	// 1. Initialize from the latest block to avoid stale history
	masterInfo, err := s.client.GetMasterchainInfo(ctx)
	if err != nil {
		log.Fatalf("❌ [Indexer] Failed to fetch masterchain info: %v", err)
	}

	lastSeqno := masterInfo.SeqNo

	for {
		select {
		case <-ctx.Done():
			log.Println("🛑 [Indexer] Block listener shutting down...")
			return
		default:
			// 2. High-frequency block pulse check
			currentInfo, err := s.client.GetMasterchainInfo(ctx)
			if err != nil || currentInfo.SeqNo <= lastSeqno {
				time.Sleep(200 * time.Millisecond) // Sub-second pulse to minimize wait-time
				continue
			}

			// 3. Parallel Block Processing: Traverse blocks from last known to tip
			for seq := lastSeqno + 1; seq <= currentInfo.SeqNo; seq++ {
				go s.scanBlockTransactions(ctx, seq)
			}

			lastSeqno = currentInfo.SeqNo
		}
	}
}

// syncOpCode is the AMM pool "Sync" event opcode emitted on every reserve update.
const syncOpCode uint32 = 0x7362d09c

// scanBlockTransactions parses transactions targeting the router for Sync (reserve update) events.
// It reads the real reserves from the on-chain message body and feeds the sniper engine.
// No mock data: if a block yields no parseable Sync event, the local cache is left untouched.
func (s *BlockScanner) scanBlockTransactions(ctx context.Context, seqno uint32) {
	// 1. Resolve the masterchain block, then fan out to its shard blocks where
	//    account transactions actually live.
	master, err := s.client.LookupBlock(ctx, -1, -0x8000000000000000, seqno)
	if err != nil {
		log.Printf("⚠\ufe0f [Indexer] LookupBlock #%d failed: %v", seqno, err)
		return
	}

	shards, err := s.client.GetBlockShardsInfo(ctx, master)
	if err != nil {
		log.Printf("⚠\ufe0f [Indexer] GetBlockShardsInfo #%d failed: %v", seqno, err)
		return
	}

	// Include the masterchain block itself alongside its shard blocks.
	blocks := append([]*ton.BlockIDExt{master}, shards...)
	for _, blk := range blocks {
		s.scanShortInfos(ctx, blk)
	}
}

// scanShortInfos lists every transaction in a shard block and inspects the ones
// whose account matches the target router.
func (s *BlockScanner) scanShortInfos(ctx context.Context, blk *ton.BlockIDExt) {
	var after *ton.TransactionID3
	for {
		txs, more, err := s.client.GetBlockTransactionsV2(ctx, blk, 100, after)
		if err != nil {
			log.Printf("⚠\ufe0f [Indexer] GetBlockTransactionsV2 failed (block %d): %v", blk.SeqNo, err)
			return
		}

		for i := range txs {
			info := txs[i]
			addr := address.NewAddress(0, byte(blk.Workchain), info.Account)
			// Only the router emits the Sync events we care about.
			if addr.String() != s.targetRouter.String() {
				continue
			}
			s.inspectTransaction(ctx, addr, info.LT, info.Hash)
		}

		if !more {
			return
		}
		last := txs[len(txs)-1]
		after = &ton.TransactionID3{Account: last.Account, LT: last.LT}
	}
}

// inspectTransaction loads a single transaction and parses its inbound message
// body for the Sync opcode, extracting the real reserve pair.
func (s *BlockScanner) inspectTransaction(ctx context.Context, addr *address.Address, lt uint64, hash []byte) {
	tx, err := s.client.GetTransaction(ctx, nil, addr, lt)
	if err != nil {
		// Fall back to address-based lookup when block context is unavailable.
		txs, lerr := s.client.ListTransactions(ctx, addr, 1, lt, hash)
		if lerr != nil || len(txs) == 0 {
			return
		}
		tx = txs[0]
	}

	if tx.IO.In == nil {
		return
	}
	in := tx.IO.In.AsInternal()
	if in == nil || in.Body == nil {
		return
	}

	body := in.Body.BeginParse()
	opCode, err := body.LoadUInt(32)
	if err != nil || uint32(opCode) != syncOpCode {
		return
	}

	// AMM Sync layout: op:uint32, reserve_in:uint128, reserve_out:uint128.
	reserveIn, err := body.LoadBigCoins()
	if err != nil {
		log.Printf("⚠\ufe0f [Indexer] Sync reserveIn parse failed: %v", err)
		return
	}
	reserveOut, err := body.LoadBigCoins()
	if err != nil {
		log.Printf("⚠\ufe0f [Indexer] Sync reserveOut parse failed: %v", err)
		return
	}

	log.Printf("⚡ [Indexer] Liquidity Sync parsed: reserveIn=%s reserveOut=%s", reserveIn.String(), reserveOut.String())

	// Zero-Latency Feed: push the real on-chain reserves into the sniper engine.
	s.engine.UpdateLocalReserves(reserveIn.Uint64(), reserveOut.Uint64())
}
