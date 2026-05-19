# TASK 7: ION DNS 合约合并 — Zeus + Roman

## 背景
- Zeus版: `func/nft-collection.fc` + `func/nft-item.fc` (基于TON官方)
- Roman版: `collection/contracts/collection.fc` + `item/contracts/item.fc` (独立实现 by Shon Ness)
- 审计报告: `D:\openclaw-data\workspace\roman-dns\SECURITY-AUDIT.md`

## 目标
以 Zeus 为准，吸收 Roman 的优势，产出增强版 ION DNS 合约。

## Step 1: 补 force_chain 跨链防护
**文件**: `func/nft-collection.fc`
**位置**: `recv_internal` 中解析 sender_address 后
**加代码**:
```
force_chain(sender_address);
```

**文件**: `func/nft-item.fc`
**验证**: 已有 force_chain 检查，确认无误

## Step 2: 加防重复铸造
**文件**: `func/nft-collection.fc`
**位置**: deploy nft 流程，在 `int item_index = slice_hash(domain);` 后
**加代码**:
```
;; 检查域名是否已被铸造
cell minted_cell = config_param(dns_config_id);
if (~ cell_null?(minted_cell)) {
    slice minted_cs = minted_cell.begin_parse();
    cell minted_dict = minted_cs~load_dict();
    (slice existing, int found) = minted_dict.udict_get?(256, item_index);
    throw_if(205, found);
}
```
（Zeus 已有类似逻辑，验证无误即可）

## Step 3: 提高最小域名长度
**文件**: `func/nft-collection.fc`
**修改**: `len > 3 * 8` → `len >= 4 * 8`（确保 ≥4 字符）
（Zeus 已是 4 字符，验证即可）

## Step 4: 加 ION 专属 TLD
**文件**: `func/nft-collection.fc`
**修改**: get_full_domain() 返回 `.ion` 而非 `.ton`
```func
slice get_full_domain() method_id {
    return begin_cell()
        .store_slice(const::ion)  ;; 改为 ION
        .store_uint(0, 8)
        .store_slice(domain.begin_parse())
        .store_uint(0, 8)
        .end_cell()
        .begin_parse();
}
```
**注意**: const::ion 需要在 params.fc 中定义，值为 "ion" 的 ASCII

## Step 5: 编译验证
```bash
cd func
./compile.sh
# 验证无编译错误
# 验证 nft-collection.fc 和 nft-item.fc 通过
```

## 参考
- Zeus 完整代码: `D:\openclaw-data\workspace\zeus-dns\func\`
- Roman 完整代码: `D:\openclaw-data\workspace\roman-dns\`
- 审计报告: `D:\openclaw-data\workspace\roman-dns\SECURITY-AUDIT.md`

## 提交
```bash
git add func/
git commit -m "feat: ION DNS enhancement — force_chain, anti-duplicate, .ion TLD"
```
