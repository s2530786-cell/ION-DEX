import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { WalletProvider } from "./context/WalletContext";
import { ThemeProvider } from "./context/ThemeContext";
import BackgroundFX from "./components/BackgroundFX";
import Layout from "./components/Layout";

import SwapPage from "./pages/SwapPage";
import PoolPage from "./pages/PoolPage";
import StakePage from "./pages/StakePage";
import BridgePage from "./pages/BridgePage";
import DashboardPage from "./pages/DashboardPage";
import AiMarketPage from "./pages/AiMarketPage";
import CopyTradePage from "./pages/CopyTradePage";
import AiSubscriptionPage from "./pages/AiSubscriptionPage";
import TradeProPage from "./pages/TradeProPage";
import LiquidityMinePage from "./pages/LiquidityMinePage";
import VaultStakePage from "./pages/VaultStakePage";
import SettingPage from "./pages/SettingPage";
import DomainManagePage from "./pages/DomainManagePage";
import BatchTransferPage from "./pages/BatchTransferPage";
import BusinessPages from "./pages/BusinessPages";
import ApproveManagerPage from "./pages/ApproveManagerPage";
import DiscoverPage from "./pages/DiscoverPage";

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <BrowserRouter>
          <BackgroundFX />
          <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/swap" replace />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/pool" element={<PoolPage />} />
            <Route path="/stake" element={<StakePage />} />
            <Route path="/bridge" element={<BridgePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ai-market" element={<AiMarketPage />} />
            <Route path="/copy-trade" element={<CopyTradePage />} />
            <Route path="/subscription" element={<AiSubscriptionPage />} />
            <Route path="/trade-pro" element={<TradeProPage />} />
            <Route path="/liquidity-mine" element={<LiquidityMinePage />} />
            <Route path="/vault" element={<VaultStakePage />} />
            <Route path="/settings" element={<SettingPage />} />
            <Route path="/domains" element={<DomainManagePage />} />
            <Route path="/batch-transfer" element={<BatchTransferPage />} />
            <Route path="/business" element={<BusinessPages />} />
            <Route path="/approvals" element={<ApproveManagerPage />} />
            <Route path="*" element={<Navigate to="/swap" replace />} />
          </Routes>
        </Layout>
        <Toaster theme="dark" position="top-right" richColors />
        </BrowserRouter>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
