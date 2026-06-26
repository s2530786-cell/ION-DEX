import { compile } from '@ton/blueprint';
import { Address, beginCell, Cell, toNano } from '@ton/core';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import '@ton/test-utils';
import 'dotenv/config';
import { preprocBuildContractsLocal } from '../helpers/helpers';
import {
    buildLibs,
    DEFAULT_JETTON_MINTER_CODE,
    DEFAULT_JETTON_WALLET_CODE,
    getWalletBalance,
    HOLE_ADDRESS,
    metadataCell,
    onchainMetadata,
    JettonMinterContract,
    JettonWalletContract,
    PTonMinterV2,
    PTonWalletV2,
    PTON_MINTER_CODE_v2,
    PTON_WALLET_CODE_v2,
} from '../libs';
import { getWalletContract } from '../libs/src/test-helpers';

import { PoolCPI as Pool } from '../wrappers/Pool';
import { LPAccount } from '../wrappers/LPAccount';
import { provideLpPayload, Router, swapPayload } from '../wrappers/Router';

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString(); };

const HOUR = 3600;

/**
 * 核心验证目标(官方从未写过的集成测试):
 *   原生 ION --(pTON 包装)--> 进 dex-core-v2 池子 --(swap)--> 换出 jetton
 *
 * 池子组成: [pTON(代表原生ION)] / [LION-mock(普通jetton)]
 * 这正是 ION/LION 正式池在主网上的真实结构。
 */
describe('pTON x dex-core-v2 集成 (原生ION 进池 swap)', () => {
    let bc: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let code: {
        router: Cell; pool: Cell; lpWallet: Cell; lpAccount: Cell; vault: Cell;
    };
    let myLibs: Cell | undefined;

    beforeAll(async () => {
        preprocBuildContractsLocal({
            dexType: 'constant_product',
            defaultIsLocked: null,
            defaultLPFee: null,
            defaultProtocolFee: null,
        });
        const _code = {
            router: await compile('Router'),
            pool: await compile('Pool'),
            lpWallet: await compile('LPWallet'),
            lpAccount: await compile('LPAccount'),
            vault: await compile('Vault'),
        };
        myLibs = buildLibs(_code as any);
        code = _code;
    });

    it('部署 Router + pTON + 建 pTON/LION 池 + 原生ION->LION 真实 swap', async () => {
        console.log('\n========== pTON x DEX 集成预演 ==========');
        bc = await Blockchain.create();
        bc.libs = myLibs;
        deployer = await bc.treasury('deployer');
        user = await bc.treasury('user');

        // ---- 1) 部署 Router ----
        const router = bc.openContract(Router.createFromConfig({
            id: 0,
            isLocked: false,
            adminAddress: deployer.address,
            lpAccountCode: code.lpAccount,
            lpWalletCode: code.lpWallet,
            poolCode: code.pool,
            vaultCode: code.vault,
        }, code.router));
        let r = await router.sendDeploy(deployer.getSender(), toNano('5'));
        expect(r.transactions).toHaveTransaction({ from: deployer.address, to: router.address, deploy: true });
        console.log('Router 部署成功:', router.address.toString());

        // ---- 2) 部署 pTON minter (代表原生 ION) ----
        const pton = bc.openContract(PTonMinterV2.createFromConfig({
            walletCode: PTON_WALLET_CODE_v2,
            content: metadataCell(onchainMetadata({ name: 'pION', symbol: 'pTON' })),
        }, PTON_MINTER_CODE_v2));
        r = await pton.sendDeploy(deployer.getSender(), toNano('5'));
        expect(r.transactions).toHaveTransaction({ to: pton.address, deploy: true });
        console.log('pTON minter 部署成功:', pton.address.toString());

        // Router 需要它自己的 pTON 钱包(池子的一边)
        await pton.sendDeployWallet(deployer.getSender(), {
            ownerAddress: router.address,
            excessesAddress: deployer.address,
        }, toNano('1'));
        const routerPtonWalletAddr = await pton.getWalletAddress(router.address);
        console.log('Router 的 pTON 钱包:', routerPtonWalletAddr.toString());

        // ---- 3) 部署 LION-mock 普通 jetton ----
        const lion = bc.openContract(JettonMinterContract.createFromConfig({
            totalSupply: 0,
            adminAddress: deployer.address,
            content: metadataCell(onchainMetadata({ name: 'LION' })),
            jettonWalletCode: DEFAULT_JETTON_WALLET_CODE,
        } as any, DEFAULT_JETTON_MINTER_CODE));
        r = await lion.sendDeploy(deployer.getSender(), toNano('1'));
        expect(r.transactions).toHaveTransaction({ to: lion.address, deploy: true });
        // 给 deployer mint LION 用于建池
        await lion.sendMint(deployer.getSender(), {
            value: toNano(2),
            toAddress: deployer.address,
            fwdAmount: toNano(1),
            masterMsg: {
                jettonAmount: toNano(1000000),
                jettonMinterAddress: lion.address,
                responseAddress: deployer.address,
            },
        });
        console.log('LION jetton 部署+铸造成功:', lion.address.toString());

        const routerLionWallet = await getWalletContract(bc, lion, router.address);
        console.log('Router 的 LION 钱包:', routerLionWallet.address.toString());

        // ---- 4) 建池: 注入 pTON 侧 (原生ION) ----
        const ION_LIQ = toNano(10000);   // 1万 原生ION
        const LION_LIQ = toNano(10000);  // 1万 LION

        // 4a) pTON 侧: 把原生ION 发到 ROUTER 的 pTON 钱包(owner=router),通知才会到 router
        const routerPtonWallet = bc.openContract(PTonWalletV2.createFromAddress(routerPtonWalletAddr));

        const provideLpToPton = provideLpPayload({
            otherTokenAddress: routerLionWallet.address,
            minLpOut: 0n,
            refundAddress: deployer.address,
            excessesAddress: deployer.address,
            toAddress: deployer.address,
            deadline: Math.floor(Date.now() / 1000) + HOUR,
        });
        r = await routerPtonWallet.sendTonTransfer(deployer.getSender(), {
            tonAmount: ION_LIQ,
            gas: toNano('1'),
            refundAddress: deployer.address,
            fwdPayload: provideLpToPton,
        });
        console.log('--- pTON 侧注入 tx 链 ---');
        for (const tx of r.transactions) {
            const inMsg = (tx as any).inMessage;
            const op = inMsg?.body ? (() => { try { return '0x' + inMsg.body.beginParse().loadUint(32).toString(16); } catch { return 'n/a'; } })() : 'no-body';
            const fromA = inMsg?.info?.src?.toString?.()?.slice(0, 10) ?? '?';
            const toA = inMsg?.info?.dest?.toString?.()?.slice(0, 10) ?? '?';
            const exit = (tx as any).description?.computePhase?.exitCode;
            console.log(`  ${fromA} -> ${toA} op=${op} exit=${exit}`);
        }
        console.log('pTON 侧注入完成');

        // ---- 开池 + 初始化 (必须在两侧注入之间,照官方 createPool 时序) ----
        const pool = bc.openContract(Pool.createFromAddress(await router.getPoolAddress({
            firstWalletAddress: routerPtonWalletAddr,
            secondWalletAddress: routerLionWallet.address,
        })));
        await pool.sendDeploy(deployer.getSender(), toNano('1'));

        // 4b) LION 侧: deployer 通过 LION 钱包 sendTransfer 到 router
        const deployerLionWallet = await getWalletContract(bc, lion, deployer.address);
        r = await deployerLionWallet.sendTransfer(deployer.getSender(), {
            value: toNano(2),
            jettonAmount: LION_LIQ,
            toAddress: router.address,
            responseAddress: deployer.address,
            fwdAmount: toNano('1'),
            fwdPayload: provideLpPayload({
                otherTokenAddress: routerPtonWalletAddr,
                minLpOut: 1n,
                refundAddress: deployer.address,
                excessesAddress: deployer.address,
                toAddress: deployer.address,
                deadline: Math.floor(Date.now() / 1000) + HOUR,
            }),
        });
        console.log('LION 侧注入完成 tx 链:');
        for (const tx of r.transactions) {
            const inMsg = (tx as any).inMessage;
            const op = inMsg?.body ? (() => { try { return '0x' + inMsg.body.beginParse().loadUint(32).toString(16); } catch { return 'n/a'; } })() : 'no-body';
            const fromA = inMsg?.info?.src?.toString?.()?.slice(0, 10) ?? '?';
            const toA = inMsg?.info?.dest?.toString?.()?.slice(0, 10) ?? '?';
            const exit = (tx as any).description?.computePhase?.exitCode;
            console.log(`  ${fromA} -> ${toA} op=${op} exit=${exit}`);
        }

        // ---- 5) 读 LP 账户实际状态 (定位 mint 为何未触发) ----
        const lpAccAddr = await pool.getLPAccountAddress({ userAddress: deployer.address });
        const lpAcc = bc.openContract(LPAccount.createFromAddress(lpAccAddr));
        try {
            const accData = await lpAcc.getLPAccountData();
            console.log('LP账户(deployer):', lpAccAddr.toString().slice(0,14));
            console.log('  user=' + accData.userAddress.toString().slice(0,14) + ' leftAmt=' + accData.leftAmount + ' rightAmt=' + accData.rightAmount);
        } catch (e) { console.log('LP账户(deployer) 读不出:', (e as any)?.message?.slice(0,60)); }

        // ---- 6) 读池储备 ----
        const pd0 = await pool.getPoolData();
        console.log('pTON/LION 池建成:', pool.address.toString());
        console.log('初始储备: left=' + pd0.leftReserve + ' right=' + pd0.rightReserve);
        console.log('池 leftJetton:', (pd0 as any).leftJettonAddress?.toString?.()?.slice(0,14), 'rightJetton:', (pd0 as any).rightJettonAddress?.toString?.()?.slice(0,14));
        console.log('routerPton :', routerPtonWalletAddr.toString().slice(0,14), ' routerLion :', routerLionWallet.address.toString().slice(0,14));
        expect(pd0.leftReserve).toBeGreaterThan(0n);
        expect(pd0.rightReserve).toBeGreaterThan(0n);
        console.log('池 leftJetton:', (pd0 as any).leftJettonAddress?.toString?.()?.slice(0,14), 'rightJetton:', (pd0 as any).rightJettonAddress?.toString?.()?.slice(0,14));
        console.log('routerPton :', routerPtonWalletAddr.toString().slice(0,14), ' routerLion :', routerLionWallet.address.toString().slice(0,14));

        // ---- 6) 真实 swap: 用户用 100 原生ION 换 LION ----
        // swap 也是把原生ION 发到 router 的 pTON 钱包,带 swapPayload
        const userLionWalletAddr = await lion.getWalletAddress(user.address);
        const before = await pool.getPoolData();
        const AMOUNT_IN = toNano(100); // 100 原生ION
        r = await routerPtonWallet.sendTonTransfer(user.getSender(), {
            tonAmount: AMOUNT_IN,
            gas: toNano('1'),
            refundAddress: user.address,
            fwdPayload: swapPayload({
                otherTokenWallet: routerLionWallet.address,
                receiver: user.address,
                minOut: 1n,
                fwdGas: 0n,
                refundAddress: user.address,
                excessesAddress: user.address,
                deadline: Math.floor(Date.now() / 1000) + HOUR,
            }),
        });
        const after = await pool.getPoolData();

        const userLionWallet = bc.openContract(JettonWalletContract.createFromAddress(userLionWalletAddr));
        let userLionBal = 0n;
        try { userLionBal = await getWalletBalance(userLionWallet); } catch { /* wallet may need deploy */ }

        console.log('\n--- 真实 swap: 100 原生ION -> LION ---');
        console.log('swap 后储备: left=' + after.leftReserve + ' right=' + after.rightReserve);
        console.log('储备变化: leftΔ=' + (after.leftReserve - before.leftReserve) + ' rightΔ=' + (after.rightReserve - before.rightReserve));
        console.log('用户换得 LION:', userLionBal.toString());

        // 一侧增加(收到原生ION)、另一侧减少(付出LION) = 真实 AMM 行为
        const oneSideUp =
            (after.leftReserve > before.leftReserve && after.rightReserve < before.rightReserve) ||
            (after.rightReserve > before.rightReserve && after.leftReserve < before.leftReserve);
        expect(oneSideUp).toBeTruthy();
        expect(userLionBal).toBeGreaterThan(0n);
        console.log('========== 集成通过: 原生ION 经 pTON 进 DEX 池 swap 全链路成立 ==========\n');
    });
});
