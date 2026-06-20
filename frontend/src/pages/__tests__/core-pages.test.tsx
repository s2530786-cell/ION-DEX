import { type ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/i18n/I18nProvider";
import { IonWalletProvider } from "@/wallet/IonWalletProvider";
import { EvmWalletProvider } from "@/wallet/EvmWalletProvider";
import { DashboardPage } from "@/pages/DashboardPage";
import { SwapPage } from "@/pages/SwapPage";
import { PoolPage } from "@/pages/PoolPage";
import { StakePage } from "@/pages/StakePage";
import { BridgePage } from "@/pages/BridgePage";

type RenderOptions = {
  route?: string;
};

function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  window.history.replaceState(null, "", options.route ?? "/");
  return render(
    <I18nProvider initialLocale="en-US">
      <IonWalletProvider>
        <EvmWalletProvider>{ui}</EvmWalletProvider>
      </IonWalletProvider>
    </I18nProvider>,
  );
}

async function findAsyncState(testId: string) {
  const candidates = [testId, `${testId}-loading`, `${testId}-error`, `${testId}-empty`];
  return screen.findByTestId((_, element) =>
    Boolean(element && candidates.includes(element.getAttribute("data-testid") ?? "")),
  );
}

describe("core DEX pages", () => {
  it("renders Dashboard with live market sections", async () => {
    renderWithProviders(<DashboardPage onNavigate={() => undefined} />);

    expect(await screen.findByTestId("page-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-main-stage")).toBeInTheDocument();
    expect(await findAsyncState("dashboard-chart")).toBeInTheDocument();
  });

  it("renders Swap with token selectors and disabled submit flow", async () => {
    renderWithProviders(<SwapPage />, { route: "/#swap" });

    expect(await screen.findByTestId("page-swap")).toBeInTheDocument();
    expect(screen.getByTestId("swap-from-token")).toBeInTheDocument();
    expect(screen.getByTestId("swap-to-token")).toBeInTheDocument();
    expect(screen.getByTestId("swap-submit")).toBeDisabled();
  });

  it("renders Pool with liquidity form and metrics lifecycle", async () => {
    renderWithProviders(<PoolPage />, { route: "/#pool" });

    expect(await screen.findByTestId("page-pool")).toBeInTheDocument();
    expect(await findAsyncState("pool-metrics")).toBeInTheDocument();
    expect(screen.getByTestId("pool-form")).toBeInTheDocument();
  });

  it("renders Stake with metrics and stake form", async () => {
    renderWithProviders(<StakePage />, { route: "/#stake" });

    expect(await screen.findByTestId("page-stake")).toBeInTheDocument();
    expect(screen.getByTestId("stake-form")).toBeInTheDocument();
    expect(screen.getByTestId("stake-submit")).toBeDisabled();
  });

  it("renders Bridge with route form and status lifecycle", async () => {
    renderWithProviders(<BridgePage />, { route: "/#bridge" });

    expect(await screen.findByTestId("page-bridge")).toBeInTheDocument();
    expect(screen.getByTestId("bridge-form")).toBeInTheDocument();
    expect(await findAsyncState("bridge-routes")).toBeInTheDocument();
    expect(screen.getByTestId("bridge-preview")).toBeInTheDocument();
  });
});
