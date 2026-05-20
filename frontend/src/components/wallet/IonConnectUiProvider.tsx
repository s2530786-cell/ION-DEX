import { TonConnectUIProvider } from "@ion-gateway/ui-react";
import { THEME } from "@ion-gateway/ui";
import type { PropsWithChildren } from "react";
import { getIonConnect } from "@/lib/wallet/ion-connect-sdk.js";
import { ionConnectManifestUrl } from "@/lib/wallet/ion-connect-manifest.js";

export function IonConnectUiProvider({ children }: PropsWithChildren) {
  return (
    <TonConnectUIProvider
      connector={getIonConnect()}
      manifestUrl={ionConnectManifestUrl()}
      restoreConnection
      uiPreferences={{
        theme: THEME.DARK,
        borderRadius: "m",
        colorsSet: {
          [THEME.DARK]: {
            accent: "#24f7ff",
            background: {
              primary: "#03050f",
              secondary: "#0b1224",
              qr: "#ffffff",
            },
            text: {
              primary: "#f8fafc",
              secondary: "#94a3b8",
            },
          },
        },
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
