import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { IonConnectUiProvider } from "@/components/wallet/IonConnectUiProvider";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <IonConnectUiProvider>
      <App />
    </IonConnectUiProvider>
  </React.StrictMode>,
);
