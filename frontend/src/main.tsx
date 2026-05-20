import "./polyfills";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { RootErrorBoundary } from "@/components/RootErrorBoundary";
import { MockDataProvider } from "@/context/MockDataContext";
import { MOCK_DATA } from "@/lib/MOCK_DATA";
import { EvmWalletProvider } from "@/wallet/EvmWalletProvider";
import { IonWalletProvider } from "@/wallet/IonWalletProvider";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <MockDataProvider value={MOCK_DATA}>
        <IonWalletProvider>
          <EvmWalletProvider>
            <App />
          </EvmWalletProvider>
        </IonWalletProvider>
      </MockDataProvider>
    </RootErrorBoundary>
  </React.StrictMode>,
);
