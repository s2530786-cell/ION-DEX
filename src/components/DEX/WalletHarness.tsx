import React from 'react';
import { DesignTokens } from '../../lib/design-tokens';
import { useWalletConnection } from '../../hooks/useWalletConnection';

/**
 * WalletHarness — ION-DEX 链上钱包连接器
 *
 * 100% 遵循 Token 契约。根据异步状态机的五个分支，
 * 动态转换边界发光特效与操作文案。
 */

export const WalletHarness: React.FC = () => {
  const {
    status,
    address,
    balanceION,
    networkName,
    errorLog,
    connectWallet,
    disconnectWallet,
    injectWrongNetworkSimulation,
    switchBackToMainnet,
  } = useWalletConnection();

  // 辅助函数：格式化超长链上钱包公钥地址
  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div
      className="flex flex-col gap-4 w-full max-w-md mx-auto p-4 rounded-3xl"
      style={{
        backgroundColor: DesignTokens.colors.panelBg,
        borderWidth: DesignTokens.borders.thin,
        borderStyle: 'solid',
        borderColor: DesignTokens.colors.panelBorder,
      }}
    >
      {/* 顶部网络与状态指示灯 */}
      <div className="flex justify-between items-center px-2">
        <span
          className="text-xs font-mono font-bold tracking-wider"
          style={{ color: DesignTokens.colors.textSecondary }}
        >
          节点状态 (NODE STATE)
        </span>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor:
                status === 'connected'
                  ? DesignTokens.colors.neonCyan
                  : status === 'wrong_network' || status === 'error'
                    ? DesignTokens.colors.neonMagenta
                    : DesignTokens.colors.textSecondary,
            }}
          />
          <span
            className="text-xs font-mono uppercase"
            style={{ color: DesignTokens.colors.textPrimary }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* 主面板内容区 */}
      <div
        className="p-5 rounded-2xl flex flex-col gap-3"
        style={{ backgroundColor: DesignTokens.colors.background }}
      >
        {status === 'disconnected' && (
          <div className="text-center py-4">
            <p
              className="text-sm font-sans mb-1"
              style={{ color: DesignTokens.colors.textPrimary }}
            >
              未检测到 Web3 签名环境
            </p>
            <p
              className="text-xs font-mono"
              style={{ color: DesignTokens.colors.textSecondary }}
            >
              请连接您的 ION 安全加密钱包以授权 DEX 交易
            </p>
          </div>
        )}

        {status === 'connecting' && (
          <div className="text-center py-4 animate-pulse">
            <p
              className="text-sm font-mono"
              style={{ color: DesignTokens.colors.neonCyan }}
            >
              正在解析链上握手协议...
            </p>
          </div>
        )}

        {status === 'connected' && (
          <div className="flex flex-col gap-2 font-mono">
            <div className="flex justify-between items-center">
              <span
                className="text-xs"
                style={{ color: DesignTokens.colors.textSecondary }}
              >
                绑定地址:
              </span>
              <span
                className="text-sm font-bold text-right"
                style={{ color: DesignTokens.colors.textPrimary }}
              >
                {formatAddress(address)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className="text-xs"
                style={{ color: DesignTokens.colors.textSecondary }}
              >
                当前网络:
              </span>
              <span
                className="text-sm font-bold text-right"
                style={{ color: DesignTokens.colors.neonCyan }}
              >
                {networkName}
              </span>
            </div>
            <div
              className="flex justify-between items-center mt-2 pt-2 border-t"
              style={{ borderColor: DesignTokens.colors.panelBorder }}
            >
              <span
                className="text-xs"
                style={{ color: DesignTokens.colors.textSecondary }}
              >
                ION 净资产:
              </span>
              <span
                className="text-xl font-bold text-right"
                style={{ color: DesignTokens.colors.textPrimary }}
              >
                {balanceION} ION
              </span>
            </div>
          </div>
        )}

        {(status === 'wrong_network' || status === 'error') && (
          <div
            className="p-3 rounded-xl border font-mono text-xs flex flex-col gap-2"
            style={{
              backgroundColor: DesignTokens.colors.panelBg,
              borderColor: DesignTokens.colors.neonMagenta,
            }}
          >
            <span
              className="font-bold"
              style={{ color: DesignTokens.colors.neonMagenta }}
            >
              [警告拦截] CRITICAL EXCEPTION
            </span>
            <span style={{ color: DesignTokens.colors.textPrimary }}>
              {errorLog}
            </span>
          </div>
        )}
      </div>

      {/* 底部交互控制按钮组 */}
      <div className="flex flex-col gap-2">
        {status === 'disconnected' && (
          <button
            onClick={connectWallet}
            className="w-full py-3 rounded-xl font-bold font-sans text-sm transition-all duration-300"
            style={{
              backgroundColor: DesignTokens.colors.neonCyan,
              color: DesignTokens.colors.background,
              boxShadow: DesignTokens.effects.neonShadowCyan,
            }}
          >
            连接 ION 钱包
          </button>
        )}

        {status === 'connected' && (
          <div className="flex gap-2">
            <button
              onClick={injectWrongNetworkSimulation}
              className="flex-1 py-2 rounded-xl font-mono text-xs border transition-colors"
              style={{
                borderColor: DesignTokens.colors.panelBorder,
                color: DesignTokens.colors.textSecondary,
              }}
            >
              模拟切错网络
            </button>
            <button
              onClick={disconnectWallet}
              className="flex-1 py-2 rounded-xl font-sans text-xs font-bold transition-all"
              style={{
                backgroundColor: DesignTokens.colors.panelBg,
                color: DesignTokens.colors.neonMagenta,
                borderWidth: DesignTokens.borders.thin,
                borderStyle: 'solid',
                borderColor: DesignTokens.colors.neonMagenta,
              }}
            >
              断开连接
            </button>
          </div>
        )}

        {status === 'wrong_network' && (
          <button
            onClick={switchBackToMainnet}
            className="w-full py-3 rounded-xl font-bold font-sans text-sm animate-bounce"
            style={{
              backgroundColor: DesignTokens.colors.neonMagenta,
              color: DesignTokens.colors.textPrimary,
              boxShadow: DesignTokens.effects.neonShadowMagenta,
            }}
          >
            一键切回 ION 正式网
          </button>
        )}

        {status === 'error' && (
          <button
            onClick={connectWallet}
            className="w-full py-3 rounded-xl font-bold font-sans text-sm"
            style={{
              backgroundColor: DesignTokens.colors.panelBg,
              color: DesignTokens.colors.textPrimary,
              borderWidth: DesignTokens.borders.thin,
              borderStyle: 'solid',
              borderColor: DesignTokens.colors.panelBorder,
            }}
          >
            重新尝试连接
          </button>
        )}
      </div>
    </div>
  );
};

export default WalletHarness;
