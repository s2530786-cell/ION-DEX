import "./polyfills";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { applyAppSettingsToDocument, loadAppSettings } from "@/lib/appSettings";
import { IonConnectUiProvider } from "@/components/wallet/IonConnectUiProvider";
import { EvmWalletProvider } from "@/wallet/EvmWalletProvider";
import { IonWalletProvider } from "@/wallet/IonWalletProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { startEip6963Discovery } from "@/wallet/eip6963";
import "./styles/global.css";

if (import.meta.env.VITE_E2E_STABLE === "1") {
  document.documentElement.dataset.ionE2eStable = "1";
}

try {
  sessionStorage.removeItem("ion-dex-skip-boot");
} catch {
  /* private mode */
}

const initialSettings = loadAppSettings();

applyAppSettingsToDocument(initialSettings);
startEip6963Discovery();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider initialLocale={initialSettings.locale}>
      <IonConnectUiProvider>
        <IonWalletProvider>
          <EvmWalletProvider>
            <App />
          </EvmWalletProvider>
        </IonWalletProvider>
      </IonConnectUiProvider>
    </I18nProvider>
  </React.StrictMode>,
);
