import "./polyfills";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { IonConnectUiProvider } from "@/components/wallet/IonConnectUiProvider";
import { EvmWalletProvider } from "@/wallet/EvmWalletProvider";
import { IonWalletProvider } from "@/wallet/IonWalletProvider";
import "./styles/global.css";
import "./styles/theme.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <IonConnectUiProvider>
      <IonWalletProvider>
        <EvmWalletProvider>
          <App />
        </EvmWalletProvider>
      </IonWalletProvider>
    </IonConnectUiProvider>
  </React.StrictMode>,
);
