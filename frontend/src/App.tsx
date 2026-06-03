import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { AppShell, type PageKey } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";

import { pageKeyFromHash, writePageHash } from "@/lib/pageRouting";
import { BusinessPage, type BusinessPageKey } from "@/pages/BusinessPages";
import { DashboardPage } from "@/pages/DashboardPage";
import { PoolPage } from "@/pages/PoolPage";
import { StakePage } from "@/pages/StakePage";
import { BridgePage } from "@/pages/BridgePage";
import { SwapPage } from "@/pages/SwapPage";
import { TradeProPage } from "@/pages/TradeProPage";
import { ApproveManagerPage } from "@/pages/ApproveManagerPage";
import { VaultStakePage } from "@/pages/VaultStakePage";
import { CopyTradePage } from "@/pages/CopyTradePage";
import { LiquidityMinePage } from "@/pages/LiquidityMinePage";
import { DomainManagePage } from "@/pages/DomainManagePage";
import { AiSubscriptionPage } from "@/pages/AiSubscriptionPage";
import { SettingPage } from "@/pages/SettingPage";
import { BatchTransferPage } from "@/pages/BatchTransferPage";

/** Doubao-derived pages (trade-pro / approve-manager / vault-stake) are scaffold previews — see each page banner. */
const businessPages = new Set<BusinessPageKey>([
  "trade",
  "grid",
  "burn",
]);

function isBusinessPage(page: PageKey): page is BusinessPageKey {
  return businessPages.has(page as BusinessPageKey);
}

function PageRouter({
  page,
  onNavigate,
}: {
  page: PageKey;
  onNavigate: (next: PageKey) => void;
}) {
  switch (page) {
    case "dashboard":
      return <DashboardPage onNavigate={onNavigate} />;
    case "swap":
      return <SwapPage />;
    case "trade-pro":
      return <TradeProPage />;
    case "approve-manager":
      return <ApproveManagerPage />;
    case "vault-stake":
      return <VaultStakePage />;
    case "pool":
      return <PoolPage />;
    case "stake":
      return <StakePage />;
    case "bridge":
      return <BridgePage />;
    case "copy-trade":
      return <CopyTradePage />;
    case "batch-transfer":
      return <BatchTransferPage />;
    case "liquidity-mine":
      return <LiquidityMinePage />;
    case "domain":
      return <DomainManagePage />;
    case "ai":
      return <AiSubscriptionPage />;
    case "ai-trading":
      return <AiSubscriptionPage />;
    case "settings":
      return <SettingPage />;
    default:
      if (isBusinessPage(page)) {
        return <BusinessPage page={page} />;
      }
      return <DashboardPage onNavigate={onNavigate} />;
  }
}

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activePage, setActivePage] = useState<PageKey>(() => pageKeyFromHash());

  const navigate = useCallback((page: PageKey) => {
    setActivePage(page);
    writePageHash(page);
  }, []);

  useEffect(() => {
    const onHashChange = () => setActivePage(pageKeyFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <>
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <AppShell activePage={activePage} onPageChange={navigate}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                initial={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="min-w-0"
              >
                <PageContent>
                  <PageRouter onNavigate={navigate} page={activePage} />
                </PageContent>
              </motion.div>
            </AnimatePresence>
          </AppShell>
        </div>
      )}
    </>
  );
}
