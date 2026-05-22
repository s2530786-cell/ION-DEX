import { useState } from "react";
import ionLogoFallback from "@/assets/ion-logo.jpg";

type IonDexBrandEmblemProps = {
  /** Compact layout for dashboard-embedded swap. */
  compact?: boolean;
  /** Show ION DEX wordmark under the cube. */
  showWordmark?: boolean;
  testId?: string;
};

/**
 * Swap / hero brand mark: layered neon halo + isometric logo + floor reflection.
 * Uses public logo-circular.png when present; avoids stacking controls on the cube.
 */
export function IonDexBrandEmblem({
  compact = false,
  showWordmark = true,
  testId = "ion-brand-emblem",
}: IonDexBrandEmblemProps) {
  const size = compact ? "sm" : "md";
  const [logoSrc, setLogoSrc] = useState("/logo-circular.png");

  return (
    <div
      className={["ion-brand-emblem", size === "sm" ? "ion-brand-emblem--sm" : ""]
        .filter(Boolean)
        .join(" ")}
      data-testid={testId}
    >
      <div aria-hidden="true" className="ion-brand-emblem__halo ion-brand-emblem__halo--cyan" />
      <div aria-hidden="true" className="ion-brand-emblem__halo ion-brand-emblem__halo--magenta" />

      <div className="ion-brand-emblem__stack">
        <img
          alt=""
          className="ion-brand-emblem__logo"
          decoding="async"
          onError={() => setLogoSrc(ionLogoFallback)}
          src={logoSrc}
        />
        <div aria-hidden="true" className="ion-brand-emblem__reflect">
          <img
            alt=""
            className="ion-brand-emblem__logo ion-brand-emblem__logo--reflect"
            src={logoSrc}
          />
        </div>
      </div>

      {showWordmark ? (
        <p className="ion-brand-emblem__wordmark" data-testid={`${testId}-wordmark`}>
          ION DEX
        </p>
      ) : null}
    </div>
  );
}
