import { useState } from "react";
import { AppShell, type PageKey } from "@/components/layout/AppShell";
import { BusinessPage } from "@/pages/BusinessPages";
import { DashboardPage } from "@/pages/DashboardPage";

export function App() {
  const [activePage, setActivePage] = useState<PageKey>("swap");

  return (
    <AppShell activePage={activePage} onPageChange={setActivePage}>
      {activePage === "swap" ? (
        <DashboardPage onNavigate={setActivePage} />
      ) : (
        <BusinessPage page={activePage} />
      )}
    </AppShell>
  );
}
