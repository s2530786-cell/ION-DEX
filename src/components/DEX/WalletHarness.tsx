import React from 'react';
import { DesignTokens } from '../../lib/design-tokens';
import { useWalletConnection } from '../../hooks/useWalletConnection';

/**
 * WalletHarness v2.0 — ION-DEX 链上钱包连接器
 *
 * Deep Space 深空背景 + 霓虹边框发光 + Glassmorphism 卡片
 * 对接真实 MetaMask / WalletConnect，零 mock。
 */

export const WalletHarness: React.FC = () => {
  const {
    status,
    address,
    balanceION,
    networkName,
    errorLog,
    providerKind,
    availableProviders,
    connectWallet,
    disconnectWallet,
    injectWrongNetworkSimulation,
    switchBackToMainnet,
  } = useWalletConnection();

  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const statusColor =
    status === 'connected'
      ? DesignTokens.colors.neonCyan
      : status === 'wrong_network' || status === 'error'
        ? DesignTokens.colors.neonMagenta
        : DesignTokens.colors.textSecondary;

  const statusLabel: Record<string, string> = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    connected: 'Connected',
    wrong_network: 'Wrong Network',
    error: 'Error',
  };

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: DesignTokens.colors.background,
        boxShadow: `0 0 60px ${DesignTokens.colors.cyanOverlay}, 0 0 120px rgba(0,0,0,0.5)`,
      }}
    >
      <div
        className="relative z-10 flex flex-col gap-4"
        style={{
          backgroundColor: DesignTokens.colors.glassBase,
          backdropFilter: DesignTokens.effects.glassBlur,
          WebkitBackdropFilter: DesignTokens.effects.glassBlur,
          borderWidth: DesignTokens.borders.thin,
          borderStyle: 'solid',
          borderColor: DesignTokens.colors.panelBorder,
          borderRadius: DesignTokens.spacing.borderRadius,
          padding: DesignTokens.spacing.cardPadding,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            className="font-bold tracking-wide"
            style={{
              fontSize: DesignTokens.typography.heading.fontSize,
              fontWeight: DesignTokens.typography.heading.fontWeight,
              color: DesignTokens.colors.textPrimary,
            }}
          >
            Wallet
          </h2>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: statusColor }}
            />
            <span
              className="font-mono uppercase tracking-wider"
              style={{
                fontSize: DesignTokens.typography.badgeLabel.fontSize,
                letterSpacing: DesignTokens.typography.badgeLabel.letterSpacing,
                color: statusColor,
              }}
            >
              {statusLabel[status]}
            </span>
          </div>
        </div>

        {/* Content area */}
        <div
          className="p-5 rounded-2xl flex flex-col gap-3"
          style={{
            backgroundColor: DesignTokens.colors.background,
            borderWidth: DesignTokens.borders.thin,
            borderStyle: 'solid',
            borderColor: DesignTokens.colors.surfaceBorder,
          }}
        >
          {status === 'disconnected' && (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: DesignTokens.colors.cyanOverlay }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: DesignTokens.colors.neonCyan }}>
                  <path d="M19 7h-1V6a6 6 0 00-12 0v1H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p style={{ fontSize: DesignTokens.typography.body.fontSize, color: DesignTokens.colors.textPrimary }}>
                Connect your wallet
              </p>
              <p style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                to start swapping on ION DEX
              </p>
            </div>
          )}

          {status === 'connecting' && (
            <div className="text-center py-6 animate-pulse">
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: DesignTokens.colors.neonCyan, borderTopColor: 'transparent' }}
              />
              <p className="font-mono" style={{ fontSize: DesignTokens.typography.body.fontSize, color: DesignTokens.colors.neonCyan }}>
                Connecting to wallet...
              </p>
            </div>
          )}

          {status === 'connected' && (
            <div className="flex flex-col gap-3 font-mono">
              <div className="flex justify-between items-center">
                <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                  Address
                </span>
                <span className="font-bold" style={{ fontSize: DesignTokens.typography.body.fontSize, color: DesignTokens.colors.textPrimary }}>
                  {formatAddress(address)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                  Network
                </span>
                <span className="font-bold" style={{ fontSize: DesignTokens.typography.body.fontSize, color: DesignTokens.colors.neonCyan }}>
                  {networkName}
                </span>
              </div>
              {providerKind && (
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                    Provider
                  </span>
                  <span
                    className="px-2 py-0.5 rounded font-bold uppercase"
                    style={{
                      fontSize: '10px',
                      backgroundColor: DesignTokens.colors.cyanOverlay,
                      color: DesignTokens.colors.neonCyan,
                    }}
                  >
                    {providerKind}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between items-center pt-3"
                style={{ borderTopWidth: DesignTokens.borders.thin, borderTopStyle: 'solid', borderTopColor: DesignTokens.colors.surfaceBorder }}
              >
                <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                  ION Balance
                </span>
                <span className="font-bold" style={{ fontSize: DesignTokens.typography.dataValue.fontSize, color: DesignTokens.colors.textPrimary }}>
                  {balanceION} ION
                </span>
              </div>
            </div>
          )}

          {(status === 'wrong_network' || status === 'error') && (
            <div
              className="p-3 rounded-xl border font-mono flex flex-col gap-2"
              style={{
                backgroundColor: DesignTokens.colors.magentaDark,
                borderColor: DesignTokens.colors.neonMagenta,
              }}
            >
              <span className="font-bold" style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.neonMagenta }}>
                ⚠ {status === 'wrong_network' ? 'Wrong Network' : 'Connection Error'}
              </span>
              <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textPrimary }}>
                {errorLog}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {status === 'disconnected' && (
            <div className="flex flex-col gap-2">
              {availableProviders.includes('metamask') && (
                <button
                  onClick={() => connectWallet('metamask')}
                  className="w-full py-3 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${DesignTokens.colors.neonCyan} 0%, #0088cc 100%)`,
                    color: DesignTokens.colors.background,
                    boxShadow: `0 0 20px ${DesignTokens.colors.neonCyan}40`,
                    fontSize: DesignTokens.typography.buttonLabel.fontSize,
                    letterSpacing: DesignTokens.typography.buttonLabel.letterSpacing,
                  }}
                >
                  MetaMask
                </button>
              )}
              {availableProviders.includes('walletconnect') && (
                <button
                  onClick={() => connectWallet('walletconnect')}
                  className="w-full py-3 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    backgroundColor: DesignTokens.colors.panelBg,
                    color: DesignTokens.colors.textPrimary,
                    borderWidth: DesignTokens.borders.thin,
                    borderStyle: 'solid',
                    borderColor: DesignTokens.colors.panelBorder,
                    fontSize: DesignTokens.typography.buttonLabel.fontSize,
                    letterSpacing: DesignTokens.typography.buttonLabel.letterSpacing,
                  }}
                >
                  WalletConnect
                </button>
              )}
              {availableProviders.length === 0 && (
                <p style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textMuted, textAlign: 'center' }}>
                  No wallet detected. Install MetaMask to continue.
                </p>
              )}
            </div>
          )}

          {status === 'connected' && (
            <div className="flex gap-2">
              <button
                onClick={injectWrongNetworkSimulation}
                className="flex-1 py-2 rounded-xl font-mono transition-colors"
                style={{
                  fontSize: DesignTokens.typography.caption.fontSize,
                  backgroundColor: 'transparent',
                  borderWidth: DesignTokens.borders.thin,
                  borderStyle: 'solid',
                  borderColor: DesignTokens.colors.surfaceBorder,
                  color: DesignTokens.colors.textMuted,
                }}
              >
                Sim. Wrong Net
              </button>
              <button
                onClick={disconnectWallet}
                className="flex-1 py-2 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: DesignTokens.colors.magentaDark,
                  color: DesignTokens.colors.neonMagenta,
                  borderWidth: DesignTokens.borders.thin,
                  borderStyle: 'solid',
                  borderColor: DesignTokens.colors.neonMagenta,
                  fontSize: DesignTokens.typography.caption.fontSize,
                }}
              >
                Disconnect
              </button>
            </div>
          )}

          {status === 'wrong_network' && (
            <button
              onClick={switchBackToMainnet}
              className="w-full py-3 rounded-xl font-bold animate-pulse transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: DesignTokens.colors.neonMagenta,
                color: DesignTokens.colors.textPrimary,
                boxShadow: `0 0 20px ${DesignTokens.colors.neonMagenta}40`,
                fontSize: DesignTokens.typography.buttonLabel.fontSize,
                letterSpacing: DesignTokens.typography.buttonLabel.letterSpacing,
              }}
            >
              Switch to BSC
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={() => connectWallet('metamask')}
              className="w-full py-3 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: DesignTokens.colors.panelBg,
                color: DesignTokens.colors.textPrimary,
                borderWidth: DesignTokens.borders.thin,
                borderStyle: 'solid',
                borderColor: DesignTokens.colors.panelBorder,
                fontSize: DesignTokens.typography.buttonLabel.fontSize,
                letterSpacing: DesignTokens.typography.buttonLabel.letterSpacing,
              }}
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>

      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${DesignTokens.colors.neonCyan}10 0%, transparent 70%)`,
        }}
      />
    </div>
  );
};

export default WalletHarness;
