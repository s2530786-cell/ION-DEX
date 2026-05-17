import { useMemo } from "react";

export function AuroraGalaxyBackground() {
  const backgroundMode = useMemo<"aurora" | "galaxy">(() => {
    return Math.floor(Date.now() / 3_600_000) % 2 === 0 ? "aurora" : "galaxy";
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#030716]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(37,99,255,0.22),transparent_32%),radial-gradient(circle_at_20%_85%,rgba(255,59,212,0.18),transparent_28%)]" />
      {backgroundMode === "aurora" ? <AuroraLayer /> : <GalaxyLayer />}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,22,0.12),rgba(3,7,22,0.74))]" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(255,255,255,0.85)_1px,transparent_1.2px)] [background-size:38px_38px]" />
    </div>
  );
}

function AuroraLayer() {
  return (
    <>
      <div className="absolute left-[-12%] top-[16%] h-[42rem] w-[92rem] rounded-[50%] bg-[linear-gradient(90deg,transparent,rgba(36,247,255,0.34),rgba(141,77,255,0.22),rgba(255,59,212,0.34),transparent)] blur-3xl [animation:ionAuroraFlow_18s_ease-in-out_infinite]" />
      <div className="absolute right-[-22%] top-[-14%] h-[46rem] w-[70rem] rounded-[50%] bg-[radial-gradient(circle,rgba(36,247,255,0.32),rgba(141,77,255,0.18)_42%,transparent_70%)] blur-3xl" />
    </>
  );
}

function GalaxyLayer() {
  return (
    <div className="absolute left-1/2 top-1/2 h-[64rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 [animation:ionSpinSlow_360s_linear_infinite]">
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_160deg,transparent,rgba(36,247,255,0.28),transparent_24%,rgba(255,59,212,0.3),transparent_55%,rgba(255,209,102,0.18),transparent_78%)] blur-2xl" />
      <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22),rgba(37,99,255,0.18)_22%,transparent_58%)]" />
    </div>
  );
}
