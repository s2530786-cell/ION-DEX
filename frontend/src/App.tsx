import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AppShell, type PageKey } from "@/components/layout/AppShell";
import { pageKeyFromHash, writePageHash } from "@/lib/pageRouting";
import type { BusinessPageKey } from "@/pages/BusinessPages";

const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const SwapPage = lazy(() => import("@/pages/SwapPage").then((m) => ({ default: m.SwapPage })));
const PoolPage = lazy(() => import("@/pages/PoolPage").then((m) => ({ default: m.PoolPage })));
const StakePage = lazy(() => import("@/pages/StakePage").then((m) => ({ default: m.StakePage })));
const BridgePage = lazy(() => import("@/pages/BridgePage").then((m) => ({ default: m.BridgePage })));
const BusinessPage = lazy(() =>
  import("@/pages/BusinessPages").then((m) => ({ default: m.BusinessPage })),
);

const businessPages = new Set<BusinessPageKey>([
  "trade",
  "grid",
  "burn",
  "domain",
  "ai",
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
    case "pool":
      return <PoolPage />;
    case "stake":
      return <StakePage />;
    case "bridge":
      return <BridgePage />;
    default:
      if (isBusinessPage(page)) {
        return <BusinessPage page={page} />;
      }
      return <DashboardPage onNavigate={onNavigate} />;
  }
}

export function App() {
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
    <AppShell activePage={activePage} onPageChange={navigate}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          initial={false}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <Suspense
            fallback={
              <div
                className="min-h-[14rem] animate-pulse rounded-3xl bg-white/[0.04]"
                data-testid="page-loading"
              />
            }
          >
            <PageRouter onNavigate={navigate} page={activePage} />
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
