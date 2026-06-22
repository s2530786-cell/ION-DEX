import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import './WalletButton.css';

export function WalletButton() {
  const { wallet, shortAddress, connectWallet, disconnectWallet } = useWallet();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <div className="wallet-button-container">
      {!wallet.isConnected ? (
        <button 
          onClick={connectWallet}
          className="connect-btn"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="wallet-connected flex items-center space-x-3">
          {/* Balance Display */}
          <div className="hidden sm:flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium">{wallet.balance} ION</span>
          </div>

          {/* Wallet Dropdown */}
          <div className="relative group">
            <button
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500"></div>
              <span className="text-sm font-medium">{shortAddress}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <div
              className={`absolute right-0 mt-2 w-48 bg-space-card border border-white/10 rounded-lg shadow-xl transition-all ${
                isDropdownOpen
                  ? 'opacity-100 visible'
                  : 'opacity-0 invisible'
              }`}
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button
                onClick={() => {
                  navigate('/portfolio');
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm hover:bg-white/10"
              >
                Portfolio
              </button>
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm hover:bg-white/10"
              >
                Settings
              </button>
              <div className="border-t border-white/10 my-1"></div>
              <button
                onClick={() => {
                  disconnectWallet();
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletButton;
