import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { AppShell, type PageKey } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";

import { pageKeyFromHash, writePageHash } from "@/lib/pageRouting";
import type { BusinessPageKey } from "@/pages/BusinessPages";
import { DashboardPage } from "@/pages/DashboardPage";

const BusinessPage = lazy(() => import("@/pages/BusinessPages").then((module) => ({ default: module.BusinessPage })));
const PoolPage = lazy(() => import("@/pages/PoolPage").then((module) => ({ default: module.PoolPage })));
const StakePage = lazy(() => import("@/pages/StakePage").then((module) => ({ default: module.StakePage })));
const BridgePage = lazy(() => import("@/pages/BridgePage").then((module) => ({ default: module.BridgePage })));
const SwapPage = lazy(() => import("@/pages/SwapPage").then((module) => ({ default: module.SwapPage })));
const TradeProPage = lazy(() => import("@/pages/TradeProPage").then((module) => ({ default: module.TradeProPage })));
const ApproveManagerPage = lazy(() => import("@/pages/ApproveManagerPage").then((module) => ({ default: module.ApproveManagerPage })));
const VaultStakePage = lazy(() => import("@/pages/VaultStakePage").then((module) => ({ default: module.VaultStakePage })));
const CopyTradePage = lazy(() => import("@/pages/CopyTradePage").then((module) => ({ default: module.CopyTradePage })));
const LiquidityMinePage = lazy(() => import("@/pages/LiquidityMinePage").then((module) => ({ default: module.LiquidityMinePage })));
const DomainManagePage = lazy(() => import("@/pages/DomainManagePage").then((module) => ({ default: module.DomainManagePage })));
const AiSubscriptionPage = lazy(() => import("@/pages/AiSubscriptionPage").then((module) => ({ default: module.AiSubscriptionPage })));
const SettingPage = lazy(() => import("@/pages/SettingPage").then((module) => ({ default: module.SettingPage })));
const BatchTransferPage = lazy(() => import("@/pages/BatchTransferPage").then((module) => ({ default: module.BatchTransferPage })));

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
  const [splashSettled, setSplashSettled] = useState(false);
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
        <SplashScreen
          onFinish={() => {
            setShowSplash(false);
            window.setTimeout(() => setSplashSettled(true), 0);
          }}
        />
      ) : (
        <div
          className={`flex min-h-0 flex-1 flex-col transition-opacity duration-300 ${
            splashSettled ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
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
                  <Suspense fallback={<div className="rounded-2xl border border-cyan-300/15 bg-white/[0.04] p-4 text-sm font-bold text-cyan-100/70">Loading ION module…</div>}>
                    <PageRouter onNavigate={navigate} page={activePage} />
                  </Suspense>
                </PageContent>
              </motion.div>
            </AnimatePresence>
          </AppShell>
        </div>
      )}
    </>
  );
}
