import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { AppShell, type PageKey } from "@/components/layout/AppShell";
import { BusinessPage, type BusinessPageKey } from "@/pages/BusinessPages";
import { DashboardPage } from "@/pages/DashboardPage";
import { PoolPage } from "@/pages/PoolPage";
import { StakePage } from "@/pages/StakePage";
import { SwapPage } from "@/pages/SwapPage";

const businessPages = new Set<BusinessPageKey>([
  "trade",
  "grid",
  "bridge",
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
    default:
      if (isBusinessPage(page)) {
        return <BusinessPage page={page} />;
      }
      return <DashboardPage onNavigate={onNavigate} />;
  }
}

export function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  return (
    <AppShell activePage={activePage} onPageChange={setActivePage}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <PageRouter onNavigate={setActivePage} page={activePage} />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
