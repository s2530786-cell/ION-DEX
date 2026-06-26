# ION 主网部署手册 — 第二步:部署地基合约 (pTON + Router)

> 本步只把 **pTON minter** 和 **Router** 两个合约刻到 ION 主网。
> **不建池、不注资、不碰你那 5 万 ION 本金。** 只花部署 gas(几个 ION)。
>
> 用的合约代码 = `tests/PtonDexIntegration.spec.ts` 沙箱里**端到端验证通过的同一份字节码**。
>
> 🔒 私钥红线:助记词只填在你本地这台机器的 `.env` 里,全程不发聊天、不经旺财之手。

---

## 0. 前置(只做一次)

```powershell
# 进项目目录
cd <你本地的 dex-core-v2 路径>

# 设代理(访问 npm / ION 主网都要)
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:HTTPS_PROXY="http://127.0.0.1:7890"

# 装依赖(用官方源)
npm install --registry=https://registry.npmjs.org/
```

---

## 1. 配 .env(填助记词)

```powershell
# 复制模板
copy .env.mainnet.example .env
```

然后用编辑器打开 `.env`,把**部署钱包(那个充了 5 万 ION 的 v4 钱包)**的 24 词助记词,
填到 `WALLET_MNEMONIC=` 后面(单词用空格隔开)。其余字段已配好:

```
ENDPOINT_URL=https://api.mainnet.ice.io/http/v2/jsonRPC
ENDPOINT_TYPE=mainnet
ENDPOINT_VERSION=v2
WALLET_VERSION=v4
WALLET_MNEMONIC=<在这里填 24 个词>
```

> ⚠️ 填完确认这个 `.env` 没被 git 跟踪(`.gitignore` 应已含 `.env`)。
> ⚠️ 部署完后建议立刻清空 `WALLET_MNEMONIC` 这行。

---

## 2. 部署 pTON minter(地基 ①)

```powershell
npx blueprint run deployPtonEmbedded --mnemonic
```

> ⚠️ **绝对不要加 `--mainnet`！** 加了 `--mainnet` blueprint 会无视 .env 里的 ION 端点,
> 把交易发到 TON 官方主网(toncenter.com)——那不是 ION 链,会被拒(account state 解不出)。
> 不加任何网络参数时,blueprint 自动读 blueprint.config.ts → .env 的 ION 主网端点。

- 脚本会先打印 pTON minter 将部署到的地址 + 浏览器链接。
- 按提示确认(`waitConfirm`)后才真正发交易。
- 花费:约 **0.1 ION** gas。
- **成功后,把脚本打印的 pTON minter 地址完整复制下来**,交给旺财链上核验。

> 如果脚本提示"已经部署过了",说明这个 minter 地址已存在,直接用打印出来的地址即可。

---

## 3. 部署 Router(地基 ②)

```powershell
npx blueprint run deployRouter constant_product --mnemonic
```

> ⚠️ 同样**不要加 `--mainnet`**,理由同上。

- 这是官方 `deployRouter.ts` 脚本,会:
  1. 自动编译 Router/Pool/LPWallet/LPAccount/Vault 5 个合约
  2. 部署 5 个 lib 合约(每个约 0.5 ION)+ Router 本体(约 0.05 ION)
  3. 全程多处 `waitConfirm` 让你确认
- 花费:约 **3.5–4 ION** gas 总计。
- `defaultIsLocked` 会显示为 `false`(unlocked,与沙箱验证一致)。
- **成功后,把打印的 Router 地址 + routerId 复制下来**,交给旺财核验。
- 部署结果会写入 `build/deploy.config.json` 的 `routerAddress` 字段。

---

## 4. 部署后 — 交给旺财核验

把以下两个地址贴给旺财:

1. **pTON minter 地址**(第 2 步产出)
2. **Router 地址 + routerId**(第 3 步产出)

旺财会做链上核验:
- 两个地址 `state=active`(真部署上去了)
- pTON minter 的 code hash == 沙箱验证过的 `PTON_MINTER_CODE_v2`
- Router 的 code hash == 本地编译产出
- 确认无误后,才进入**第三步(建池注资)**——那一步才动真钱,你拍板金额 + 备好 LION。

---

## 费用总账(第二步全部)

| 项目 | 花费 | 性质 |
|------|------|------|
| pTON minter 部署 | ~0.1 ION | gas,真消耗 |
| Router + 5 lib 部署 | ~3.5–4 ION | gas,真消耗 |
| **合计** | **~4 ION** | 几美元,刻合约的邮费 |

**本金安全:** 这一步不碰你 5 万 ION 本金,不碰 LION,只花上面这点 gas。

---

## 出问题怎么办

- **连不上主网 / 超时** → 先确认代理设了(`$env:HTTP_PROXY`),ION 主网国内被墙。
- **助记词报错** → 确认 `WALLET_VERSION=v4` 且助记词是那个 v4 部署钱包的、24 个词、空格分隔。
- **任何一步卡住** → 把完整报错贴给旺财,别自己猜着改。
