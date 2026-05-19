# Sandwich Defense — Implementation Guide for Cursor

## Step 1: Add op codes (`contracts/ion/op.fc`)

```func
;; Sandwich defense — commit-reveal swap
;; Prevents mempool front-running by hiding swap params until reveal

const op::commit_swap = 0xdeb00001 ;; op code for commit step
const op::reveal_swap = 0xdeb00002 ;; op code for reveal step
```

**Why**: Each swap operation needs unique op codes so the contract can distinguish commit vs reveal messages.

---

## Step 2: Add error codes (`contracts/ion/errors.fc`)

```func
const error::swap_expired = 401   ;; deadline passed
const error::swap_too_large = 402 ;; exceeds 5% of pool
const error::swap_not_committed = 403 ;; no prior commit
const error::swap_hash_mismatch = 404 ;; commit hash ≠ reveal hash
```

---

## Step 3: Modify pool.fc — storage

Add to pool data dictionary:

```func
;; Store active swap commitments
;; Key: sender_address (MsgAddress)
;; Value: (hash, deadline, created_at)
;;   hash = sha256(sender + amount + min_out + deadline + nonce)
;;   deadline = when this commit expires
;;   created_at = block time when committed

cell commit_cell = begin_cell()
  .store_uint(commit_hash, 256)   ;; sha256
  .store_uint(deadline, 32)       ;; block timestamp
  .store_uint(created_at, 32)     ;; block timestamp
  .end_cell();

dict_set?(pool_commitments, 256, sender_hash, commit_cell, pool_commitments);
```

**Why**: Each user's pending commit is stored in a dictionary keyed by sender. This prevents replay and allows verification at reveal time.

---

## Step 4: Add recv_internal handler for commit_swap

In `pool.fc`'s `recv_internal()`:

```func
if (op == op::commit_swap) {
    ;; Parse commit body
    slice cs = in_msg_body.begin_parse();
    int commit_hash = cs~load_uint(256);    ;; sha256 of swap params
    int deadline = cs~load_uint(32);         ;; reveal deadline
    
    ;; Validate deadline (must be in future, max 300 blocks ~5 min)
    throw_unless(error::swap_expired, deadline > now());
    throw_unless(error::swap_expired, deadline <= now() + 300);
    
    ;; Store commitment
    cell cc = begin_cell()
        .store_uint(commit_hash, 256)
        .store_uint(deadline, 32)
        .store_uint(now(), 32)
        .end_cell();
    
    ;; sender's address hash as dict key
    int sender_hash = sender_address.hash();
    (pool_commitments, int found) = dict_set?(pool_commitments, 256, sender_hash, cc);
    
    ;; Overwrite is OK — only last commit counts
    save_data(total_supply, reserve0, reserve1, pool_commitments);
    return ();
}
```

---

## Step 5: Add recv_internal handler for reveal_swap

```func
if (op == op::reveal_swap) {
    slice cs = in_msg_body.begin_parse();
    int token_amount = cs~load_coins();     ;; amount to swap
    int min_out = cs~load_coins();          ;; minimum output
    int deadline = cs~load_uint(32);        ;; must match commit
    int nonce = cs~load_uint(64);           ;; anti-replay nonce
    
    ;; Verify commitment exists
    int sender_hash = sender_address.hash();
    (cell cc, int found) = dict_get?(pool_commitments, 256, sender_hash);
    throw_unless(error::swap_not_committed, found);
    
    slice cs2 = cc.begin_parse();
    int stored_hash = cs2~load_uint(256);
    int stored_deadline = cs2~load_uint(32);
    int stored_created = cs2~load_uint(32);
    
    ;; Verify hash matches
    cell params_cell = begin_cell()
        .store_slice(sender_address)
        .store_coins(token_amount)
        .store_coins(min_out)
        .store_uint(deadline, 32)
        .store_uint(nonce, 64)
        .end_cell();
    int computed_hash = sha256(params_cell);
    throw_unless(error::swap_hash_mismatch, computed_hash == stored_hash);
    
    ;; Check deadline
    throw_unless(error::swap_expired, now() <= deadline);
    
    ;; Check max swap size (5% of pool)
    int max_swap = (reserve0 * 5) / 100;
    throw_unless(error::swap_too_large, token_amount <= max_swap);
    
    ;; Clean commitment (prevent replay)
    (pool_commitments, int _) = dict_delete?(pool_commitments, 256, sender_hash);
    
    ;; Execute swap (same as existing swap logic)
    ;; ... existing constant_product swap code here ...
    ;; Ensure actual_output >= min_out
    
    save_data(total_supply, reserve0, reserve1, pool_commitments);
    return ();
}
```

---

## Step 6: Add MAX_SWAP_PERCENT constant

```func
const MAX_SWAP_PERCENT = 5 ;; maximum 5% of pool per swap
```

---

## Step 7: Test compilation

```powershell
cd D:\openclaw-tools\ion-dex-nuke
func -PA contracts/ion/pool.fc
func -PA contracts/ion/op.fc
func -PA contracts/ion/errors.fc
```

Expected: all compile clean, no errors.

---

## Summary of changes by file

| File | Change |
|------|--------|
| `op.fc` | +2 const: `op::commit_swap`, `op::reveal_swap` |
| `errors.fc` | +4 const: swap_expired, swap_too_large, swap_not_committed, swap_hash_mismatch |
| `pool.fc` | +MAX_SWAP_PERCENT, +commitment dict in storage, +commit_swap handler, +reveal_swap handler, +5% size check |

## Key design decisions
- **Commit-reveal gap ≥ 1 block**: Commit in block N, reveal in block N+1. Frontrunner can't see reveal params at commit time.
- **Hash covers all params**: Changing min_out, amount, or deadline changes hash → mismatch at reveal.
- **Nonce prevents replay**: Even if same params used twice, nonce differs → different hash.
- **5% max**: Prevents single-tx price manipulation. Pool with 100K tokens → max 5K per swap.
