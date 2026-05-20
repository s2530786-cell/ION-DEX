import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { AppShell, type PageKey } from "@/components/layout/AppShell";
import { pageKeyFromHash, writePageHash } from "@/lib/pageRouting";
import { BusinessPage, type BusinessPageKey } from "@/pages/BusinessPages";
import { DashboardPage } from "@/pages/DashboardPage";
import { PoolPage } from "@/pages/PoolPage";
import { StakePage } from "@/pages/StakePage";
import { BridgePage } from "@/pages/BridgePage";
import { SwapPage } from "@/pages/SwapPage";
import { NeonGlassCard } from "@/components/ui/NeonGlassCard";

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

  useEffect(() => {
    console.log("NeonGlassCard mounted");
  }, []);

  return (
    <AppShell activePage={activePage} onPageChange={navigate}>
      <NeonGlassCard style={{ margin: "0 0 1rem", padding: "0.5rem 1rem" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <PageRouter onNavigate={navigate} page={activePage} />
          </motion.div>
        </AnimatePresence>
      </NeonGlassCard>
    </AppShell>
  );
}
