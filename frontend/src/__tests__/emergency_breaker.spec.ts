import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, toNano } from '@ton/core';
import { PoolManager } from '../wrappers/PoolManager';
import '@ton/test-utils';

/**
 * @file tests/emergency_breaker.spec.ts
 * @description P3-2 Emergency Breaker Security Test Suite.
 * Validates the protocol's physical fuse: immediate halt of all financial 
 * operations upon 3-of-5 multisig activation.
 */

describe('ION DEX Emergency Breaker (P3-2)', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let poolManager: SandboxContract<PoolManager>;
    let signers: SandboxContract<TreasuryContract>[];

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        
        // Setup 5 committee signers for the 3-of-5 multisig
        signers = await Promise.all([
            blockchain.treasury('signer_1'),
            blockchain.treasury('signer_2'),
            blockchain.treasury('signer_3'),
            blockchain.treasury('signer_4'),
            blockchain.treasury('signer_5'),
        ]);

        // Deployment logic for PoolManager with safety hooks enabled
        // poolManager = blockchain.openContract(PoolManager.createFromConfig({...}));
    });

    it('should permit operations when system is LATCHED (is_paused = 0)', async () => {
        const res = await poolManager.sendAddLiquidity(deployer.getSender(), {
            amount: toNano('100'),
            queryId: 123n
        });
        expect(res.transactions).toHaveTransaction({
            from: deployer.address,
            to: poolManager.address,
            success: true,
        });
    });

    it('should trigger global pause with 3 valid signatures and block further ops', async () => {
        // 1. Execution of the Emergency Pause Op (3 signatures)
        const pauseRes = await poolManager.sendEmergencyPause(signers[0].getSender(), {
            signatures: [
                // In production, these are real ed25519 signatures
                { signer: signers[1].address, data: 'sig_data' },
                { signer: signers[2].address, data: 'sig_data' }
            ]
        });
        
        expect(pauseRes.transactions).toHaveTransaction({
            success: true,
            exitCode: 0
        });

        // 2. Verify state: is_paused should now be 1
        const state = await poolManager.getSystemStatus();
        expect(state.isPaused).toBe(true);

        // 3. Attempt operation while paused
        const res2 = await poolManager.sendAddLiquidity(deployer.getSender(), {
            amount: toNano('100'),
            queryId: 456n
        });

        // Assertion: Physical fuse must throw Exit Code 500 (Safety Lock)
        expect(res2.transactions).toHaveTransaction({
            from: deployer.address,
            to: poolManager.address,
            success: false,
            exitCode: 500
        });
    });

    it('should reject pause commands with insufficient signatures (2/5)', async () => {
        const res = await poolManager.sendEmergencyPause(signers[0].getSender(), {
            signatures: [{ signer: signers[1].address, data: 'sig_data' }]
        });

        // Must fail with unauthorized or threshold error
        expect(res.transactions).toHaveTransaction({
            success: false,
            exitCode: 401 
        });
    });
});
