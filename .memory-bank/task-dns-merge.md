# TASK 7: ION DNS 合约合并 — Zeus + Roman

## 背景
- Zeus版: `func/nft-collection.fc` + `func/nft-item.fc` (基于TON官方)
- Roman版: `collection/contracts/collection.fc` + `item/contracts/item.fc` (独立实现 by Shon Ness)
- 审计报告: `D:\openclaw-data\workspace\roman-dns\SECURITY-AUDIT.md`

## 目标
以 Zeus 为准，吸收 Roman 的优势，产出增强版 ION DNS 合约。

## Step 1: 补 force_chain 跨链防护
**文件**: `func/nft-collection.fc`
**当前代码上下文** (找到这段):
```func
    if (flags & 1) { ;; ignore all bounced messages
        return ();
    }
    slice sender_address = cs~load_msg_addr();

    int op = in_msg_body~load_uint(32);
```
**在 `slice sender_address = cs~load_msg_addr();` 下一行插入**:
```func
    force_chain(sender_address);
```
**修改后全文**:
```func
    if (flags & 1) { ;; ignore all bounced messages
        return ();
    }
    slice sender_address = cs~load_msg_addr();
    force_chain(sender_address);

    int op = in_msg_body~load_uint(32);
```
**为什么**: force_chain 验证消息来自同一条链，阻止跨链重放攻击。
**验证**: `grep "force_chain" func/nft-collection.fc` 应返回一行匹配。

## Step 2: 防重复铸造 (验证)
**文件**: `func/nft-collection.fc`
**当前代码上下文** (找到这段):
```func
        int item_index = slice_hash(domain);

        cell config_cell = config_param(dns_config_id);
```
**Zeus 已有这段逻辑 — 只需验证存在**:
```func
        cell config_cell = config_param(dns_config_id);
        if (~ cell_null?(config_cell)) {
            slice config_cs = config_cell.begin_parse();
            cell config = config_cs~load_dict();
            (slice config_value, int found) = config.udict_get?(256, item_index);
            throw_if(205, found);
        }
```
**为什么**: 防止相同域名被重复铸造（sha256碰撞虽极低概率但需防御）。
**验证**: `grep "throw_if(205" func/nft-collection.fc` 应返回一行匹配。

## Step 3: 最小域名长度 (验证)
**文件**: `func/nft-collection.fc`
**目标行**: 找到 `throw_unless(200, len > 3 * 8); ;; minimum 4 characters`
**Zeus 已正确 — 只需验证**: 这行已经要求最小4字符(3*8=24bits, >表示至少25bits即4字节)。
**验证**: `grep "minimum 4 characters" func/nft-collection.fc` 应返回一行匹配。

## Step 4: 加 ION 专属 TLD ⚠️ 核心改动
**文件1**: `func/params.fc`
**当前没有 `const::ion` 定义，需要在文件末尾追加**:
```func
const ion = "ion"H;  ;; ION domain TLD
```

**文件2**: `func/nft-collection.fc` (新建 get_full_domain 方法)
**当前 Zeus 版没有 get_full_domain() 方法 — 需要在 dnsresolve 方法之前插入**:
```func
slice get_full_domain() method_id {
    var (content, nft_item_code) = load_data();
    ;; Return ".ion" TLD for this collection
    return begin_cell()
        .store_slice(const::ion)
        .store_uint(0, 8)
        .end_cell()
        .begin_parse();
}
```
**注意**: collection 层面的 get_full_domain 返回 TLD `.ion`，item 层面的返回完整域名如 `swap.ion`。
**验证**: `grep "ion"H func/params.fc` 应返回一行。

## Step 5: 编译验证 ⚠️ 死命令
```bash
cd func
./compile.sh
```
**必须看到**: 所有合约编译通过，无 error。
**如果编译失败**: 检查 const::ion 定义是否正确，检查 force_chain 拼写。
**验证清单**:
- [ ] nft-collection.fc 编译通过
- [ ] nft-item.fc 编译通过  
- [ ] ion-dns.fc 编译通过
- [ ] root-dns.fc 编译通过

## 完工标准
- `grep "force_chain" func/nft-collection.fc` → 有结果
- `grep "const::ion" func/params.fc` → 有结果
- `grep "get_full_domain" func/nft-collection.fc` → 有结果
- `./compile.sh` → exit 0

## 参考文件
| 文件 | 路径 |
|------|------|
| Zeus收藏合约 | `D:\openclaw-data\workspace\zeus-dns\func\nft-collection.fc` |
| Zeus域名项 | `D:\openclaw-data\workspace\zeus-dns\func\nft-item.fc` |
| Zeus参数 | `D:\openclaw-data\workspace\zeus-dns\func\params.fc` |
| 审计报告 | `D:\openclaw-data\workspace\roman-dns\SECURITY-AUDIT.md` |

## 提交
```bash
git add func/params.fc func/nft-collection.fc
git commit -m "feat: ION DNS enhancement — force_chain, anti-duplicate verify, .ion TLD"
```
