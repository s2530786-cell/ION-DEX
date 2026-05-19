import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { EvmWalletProvider } from "@/context/EvmWalletContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <EvmWalletProvider>
      <App />
    </EvmWalletProvider>
  </React.StrictMode>,
);
