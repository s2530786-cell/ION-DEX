import { NetworkProvider } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';
import {
    PTonMinterV2,
    PTON_MINTER_CODE_v2,
    PTON_WALLET_CODE_v2,
    metadataCell,
    onchainMetadata,
    color,
    waitConfirm,
} from '../libs';

// ION 链官方浏览器 (getExpLink 默认指向 TON 的 tonscan/tonviewer, 对 ION 链是错的)
function ionExplorerLink(addr: Address): string {
    return `https://explorer.ice.io/address/${addr.toString()}`;
}

/**
 * 部署 dex-core-v2 内嵌版 pTON minter 到 ION 主网。
 *
 * 关键: 这里用的是 dex-core-v2 内嵌的 PTON_MINTER_CODE_v2 / PTON_WALLET_CODE_v2
 *       (minter hex 5180 字符),与 tests/PtonDexIntegration.spec.ts 沙箱里
 *       端到端验证通过的【完全同一份字节码】。
 *       绝不使用 pton-contracts 独立仓库现场编译出的那份(1680 字符)。
 *
 * 这一步只把 pTON minter 合约刻到链上(地基),不建池、不注资。
 * 花费: 部署 gas ~0.05-0.5 ION。
 *
 * 运行: npx blueprint run deployPtonEmbedded --mainnet --custom <ION主网v2端点> ...
 *       (具体命令见 mainnet-deploy/DEPLOY_MANUAL.md)
 */
export async function run(provider: NetworkProvider) {
    const senderAddress = provider.sender().address as Address;

    color.log(` - <y>部署 <b>内嵌版 pTON minter<clr><y> 到 ION 主网`);
    color.log(`\t<y>minter code: <b>PTON_MINTER_CODE_v2 (dex-core-v2 内嵌, 沙箱已验证)`);
    color.log(`\t<y>wallet code: <b>PTON_WALLET_CODE_v2 (dex-core-v2 内嵌, 沙箱已验证)`);
    color.log(`\t<y>部署者地址: <b>${senderAddress.toString()}`);

    // pTON 代表原生 ION, 元数据命名 pION/pTON
    const ptonMinter = provider.open(
        PTonMinterV2.createFromConfig(
            {
                content: metadataCell(onchainMetadata({ name: 'pION', symbol: 'pTON', decimals: '9' })),
                walletCode: PTON_WALLET_CODE_v2,
            },
            PTON_MINTER_CODE_v2,
        ),
    );

    color.log(` - <y>pTON minter 将部署在: <b>${ionExplorerLink(ptonMinter.address)}`);
    color.log(`\t<y>地址(raw): <b>${ptonMinter.address.toString()}`);

    if (await provider.isContractDeployed(ptonMinter.address)) {
        color.log(` - <r>该 pTON minter 已经部署过了! 地址: ${ptonMinter.address.toString()}`);
        color.log(` - <y>无需重复部署, 直接把此地址填进后续 Router/建池配置即可.`);
        return;
    }

    color.log(` - <r><bld>确认部署? <clr><y>(花费部署 gas, 不可逆地把合约刻到主网)`);
    waitConfirm();

    await ptonMinter.sendDeploy(provider.sender(), toNano('0.1'));
    await provider.waitForDeploy(ptonMinter.address, 100);

    color.log(` - <g><bld>pTON minter 部署成功!`);
    color.log(`\t<g>地址: <b>${ptonMinter.address.toString()}`);
    color.log(`\t<g>浏览器: <b>${ionExplorerLink(ptonMinter.address)}`);
    color.log(` - <y>请把上面的地址完整复制, 交给旺财做链上核验(确认 state=active + code hash 对得上).`);
}
