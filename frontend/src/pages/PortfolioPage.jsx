import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import './PortfolioPage.css';

export function PortfolioPage() {
  const { wallet, connectWallet } = useWallet();
  const navigate = useNavigate();

  // Mock Portfolio Data
  const positions = [
    {
      id: 'pool1',
      tokenA: 'ION',
      tokenB: 'USDC',
      deposited: '5,000.00',
      fees: '124.50',
    },
    {
      id: 'pool2',
      tokenA: 'WBTC',
      tokenB: 'WION',
      deposited: '12,450.00',
      fees: '340.20',
    },
  ];

  const totalValue = useMemo(() => {
    const posValue = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.deposited.replace(',', '')),
      0
    );
    const walletBal = parseFloat(wallet.balance || '0');
    const total = posValue + walletBal;
    return total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [wallet.balance]);

  return (
    <div className="portfolio-container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-purple to-neon-cyan bg-clip-text text-transparent mb-8">
        Your Portfolio
      </h1>

      {/* Not Connected State */}
      {!wallet.isConnected ? (
        <div className="ion-card text-center py-20">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Wallet Not Connected</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view your assets, liquidity positions, and transaction history.
          </p>
          <button
            onClick={connectWallet}
            className="ion-button ion-button--primary px-8 py-3"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Total Value Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ion-card p-6">
              <div className="text-gray-400 text-sm mb-1">Total Portfolio Value</div>
              <div className="text-3xl font-bold">${totalValue}</div>
              <div className="text-green-400 text-sm mt-1">+5.2% (24h)</div>
            </div>
            <div className="ion-card p-6">
              <div className="text-gray-400 text-sm mb-1">Wallet Balance</div>
              <div className="text-3xl font-bold">{wallet.balance} ION</div>
              <div className="text-gray-400 text-sm mt-1">Available to Swap</div>
            </div>
            <div className="ion-card p-6">
              <div className="text-gray-400 text-sm mb-1">Active Positions</div>
              <div className="text-3xl font-bold">{positions.length}</div>
              <div className="text-gray-400 text-sm mt-1">Liquidity Pools</div>
            </div>
          </div>

          {/* Liquidity Positions */}
          <div>
            <h2 className="text-xl font-bold mb-4">Your Liquidity Positions</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {positions.map((pos) => (
                <div
                  key={pos.id}
                  className="ion-card p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/pool/${pos.id}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                          {pos.tokenA.charAt(0)}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white">
                          {pos.tokenB.charAt(0)}
                        </div>
                      </div>
                      <span className="font-bold text-lg">
                        {pos.tokenA}-{pos.tokenB}
                      </span>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Deposited</div>
                      <div className="font-medium">${pos.deposited}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Unclaimed Fees</div>
                      <div className="font-medium text-accent">${pos.fees}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {positions.length === 0 && (
              <div className="ion-card text-center py-12 text-gray-500">
                You don't have any active liquidity positions yet.
                <a
                  href="/pools"
                  className="text-cyan-400 hover:underline ml-1"
                >
                  Explore Pools
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PortfolioPage;
