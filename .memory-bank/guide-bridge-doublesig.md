# Bridge Double-Signature — Implementation Guide for Cursor

## Strategy

Transfers above $10K equivalent require 2-of-3 validator signatures. Validators are off-chain bots that verify bridge requests and co-sign.

---

## Part A: BSC Side (Solidity)

### Step 1: Create validator interface (`contracts/bsc/src/interfaces/IBridgeValidator.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBridgeValidator
 * @notice Validator set for bridge double-signature verification.
 *         Transfers above DOUBLE_SIG_THRESHOLD require 2-of-3 validator signatures.
 */
interface IBridgeValidator {
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    
    /// @notice Maximum number of validators
    function MAX_VALIDATORS() external view returns (uint256);
    
    /// @notice Minimum signatures required for large transfers
    function REQUIRED_SIGNATURES() external view returns (uint256);
    
    /// @notice Transfer amount above which double-sig is required
    function doubleSigThreshold() external view returns (uint256);
    
    /// @notice Check if address is an active validator
    function isValidator(address account) external view returns (bool);
    
    /// @notice Get validator count
    function validatorCount() external view returns (uint256);
    
    /// @notice Verify a set of signatures against a bridge request
    /// @param requestHash EIP-712 hash of the bridge request
    /// @param signatures Array of validator signatures
    /// @return valid True if threshold of valid signatures met
    function verifySignatures(
        bytes32 requestHash,
        bytes[] calldata signatures
    ) external view returns (bool valid);
}
```

**Why**: Interface-first design. Easy to swap validators, test with mocks, and upgrade later.

---

### Step 2: Add to BSCFeeVault.sol

Add this state and constructor:

```solidity
// Validator set for double-signature
address[] public validators;
mapping(address => bool) public isValidator;
uint256 public doubleSigThreshold; // in token wei (e.g., 10000 * 10^18 for $10K)
uint256 public constant REQUIRED_SIGNATURES = 2;
uint256 public constant MAX_VALIDATORS = 10;

// EIP-712 domain separator for bridge requests
bytes32 public constant EIP712_DOMAIN_TYPEHASH = keccak256(
    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
);
bytes32 public constant BRIDGE_REQUEST_TYPEHASH = keccak256(
    "BridgeRequest(address sender,uint256 amount,uint256 deadline,uint256 nonce,bytes32 targetChain)"
);
bytes32 public immutable DOMAIN_SEPARATOR;

constructor(...) {
    DOMAIN_SEPARATOR = keccak256(abi.encode(
        EIP712_DOMAIN_TYPEHASH,
        keccak256("IONBridge"),
        keccak256("1"),
        block.chainid,
        address(this)
    ));
    
    // Default: $10,000 equivalent (18 decimals)
    doubleSigThreshold = 10000 * 10 ** 18;
}
```

**Why**: EIP-712 standard for typed structured data signing. All major wallets support it. Validators can use any EIP-712 compatible tool to sign.

---

### Step 3: Modify bridge transfer function

In the bridge/lock function, add before execution:

```solidity
function lockTokens(uint256 amount, uint256 deadline, uint256 nonce, bytes calldata validatorSigs) external {
    // ... existing validation ...
    
    // Double-signature check for large transfers
    if (amount >= doubleSigThreshold) {
        bytes32 requestHash = keccak256(abi.encode(
            BRIDGE_REQUEST_TYPEHASH,
            msg.sender,
            amount,
            deadline,
            nonce,
            keccak256("ION_MAINNET")
        ));
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, requestHash));
        
        uint256 validCount = _countValidSignatures(digest, validatorSigs);
        require(validCount >= REQUIRED_SIGNATURES, "Need 2+ validator signatures");
    }
    
    // ... execute transfer ...
}
```

**Why**: `\x19\x01` prefix is the EIP-712 standard. Without it, signatures won't verify correctly.

---

### Step 4: Signature verification helper

```solidity
function _countValidSignatures(bytes32 digest, bytes calldata sigs) internal view returns (uint256 count) {
    // Each signature is 65 bytes (r + s + v)
    uint256 sigCount = sigs.length / 65;
    address[] memory seen = new address[](sigCount);
    uint256 seenCount;
    
    for (uint256 i = 0; i < sigCount; i++) {
        bytes memory sig = sigs[i * 65 : (i + 1) * 65];
        address signer = _recover(digest, sig);
        
        // Ignore invalid or duplicate signers
        if (isValidator[signer] && !_contains(seen, seenCount, signer)) {
            seen[seenCount++] = signer;
            count++;
        }
        
        if (count >= REQUIRED_SIGNATURES) break; // Early exit
    }
}

function _recover(bytes32 digest, bytes memory sig) internal pure returns (address) {
    require(sig.length == 65, "Invalid sig length");
    bytes32 r;
    bytes32 s;
    uint8 v;
    assembly {
        r := mload(add(sig, 32))
        s := mload(add(sig, 64))
        v := byte(0, mload(add(sig, 96)))
    }
    if (v < 27) v += 27;
    return ecrecover(digest, v, r, s);
}
```

---

### Step 5: Governance functions

```solidity
function addValidator(address validator) external onlyOwner {
    require(validator != address(0), "Zero address");
    require(!isValidator[validator], "Already validator");
    require(validators.length < MAX_VALIDATORS, "Too many validators");
    validators.push(validator);
    isValidator[validator] = true;
    emit ValidatorAdded(validator);
}

function removeValidator(address validator) external onlyOwner {
    require(isValidator[validator], "Not a validator");
    // Remove by swapping with last and popping
    for (uint256 i = 0; i < validators.length; i++) {
        if (validators[i] == validator) {
            validators[i] = validators[validators.length - 1];
            validators.pop();
            break;
        }
    }
    isValidator[validator] = false;
    emit ValidatorRemoved(validator);
}

function setDoubleSigThreshold(uint256 newThreshold) external onlyOwner {
    emit ThresholdUpdated(doubleSigThreshold, newThreshold);
    doubleSigThreshold = newThreshold;
}
```

**Why**: `onlyOwner` keeps governance simple. Swap-and-pop removal is O(1) gas. Events let off-chain services track validator changes.

---

## Part B: ION Side (FunC)

### Step 6: Add validator config to params.fc

```func
;; Bridge double-signature validators
;; Store as (pubkey_hash -> weight). Weight > 0 = active validator.
;; Managed by governance messages.

const bridge::max_validators = 10
const bridge::required_signatures = 2
const bridge::double_sig_threshold = 10000  ;; $10K equivalent in ION (9 decimals = 10000 * 10^9)
```

---

### Step 7: In vault.fc or bridge contract

Add to storage:
```func
;; validator_pubkeys: dictionary (int pubkey_hash -> int weight)
cell validator_dict = new_dict();
```

Add incoming bridge handler:
```func
;; When receiving bridge transfer > threshold, verify validators
if (amount >= bridge::double_sig_threshold) {
    slice cs = incoming_msg_body;
    
    ;; Parse validator signatures from message body
    int sig_count = cs~load_uint(8);
    
    ;; Build message hash (same as BSC side)
    cell hash_cell = begin_cell()
        .store_slice(sender_address)
        .store_coins(amount)
        .store_uint(deadline, 32)
        .store_uint(nonce, 64)
        .end_cell();
    int msg_hash = sha256(hash_cell);
    
    ;; Count valid signatures
    int valid = 0;
    int i = 0;
    while (i < sig_count & valid < bridge::required_signatures) {
        slice sig = cs~load_bits(512);  ;; 64 bytes signature
        int pubkey = cs~load_uint(256);  ;; validator pubkey
        
        ;; Check pubkey has weight > 0
        (int weight, int found) = dict_get?(validator_dict, 256, pubkey);
        if (found & weight > 0) {
            ;; Verify signature
            if (check_signature(msg_hash, sig, pubkey)) {
                valid += 1;
            }
        }
        i += 1;
    }
    
    throw_unless(error::insufficient_signatures, valid >= bridge::required_signatures);
}
```

---

## Part C: Test

```powershell
# BSC
cd D:\openclaw-tools\ion-dex-nuke
$env:HTTP_PROXY="http://127.0.0.1:7890"
forge build

# ION
func -PA contracts/ion/params.fc
func -PA contracts/ion/vault.fc
```

---

## Summary of changes

| File | Type | Change |
|------|------|--------|
| `contracts/bsc/src/interfaces/IBridgeValidator.sol` | NEW | Validator interface |
| `contracts/bsc/src/BSCFeeVault.sol` | MODIFY | +validator set, +EIP-712, +double-sig verify |
| `contracts/ion/params.fc` | MODIFY | +validator config constants |
| `contracts/ion/vault.fc` or `bridge.fc` | MODIFY | +validator sig check on inbound |

## Key numbers
- **Threshold**: $10,000 (10000 * 10^18 for BSC, 10000 * 10^9 for ION)
- **Signatures required**: 2 of maximum 10 validators
- **Each signature**: 65 bytes (r=32, s=32, v=1)
- **Gas cost per sig verification**: ~3000 gas (ecrecover on EVM)

## Off-chain validator bot (future task)
Validators should be simple bots that:
1. Listen for bridge events
2. Verify the transfer is legitimate
3. Sign with EIP-712 and submit via relay
