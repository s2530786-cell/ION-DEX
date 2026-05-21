import { AnimatePresence, easeIn, easeInOut, easeOut, motion } from "framer-motion";
import { useEffect, useState } from "react";

const SPLASH_KEY = "ion-dex-splash-shown";

const businessLines = [
  { key: "swap", label: "Swap", sub: "Instant ION <> BNB", delay: 0.4 },
  { key: "trade", label: "Trade", sub: "Limit orders on-chain", delay: 0.55 },
  { key: "grid", label: "Grid", sub: "Spot grid strategies", delay: 0.7 },
  { key: "pool", label: "Pool", sub: "Liquidity mining", delay: 0.85 },
  { key: "stake", label: "Stake", sub: "Earn up to 12% APY", delay: 1.0 },
  { key: "bridge", label: "Bridge", sub: "BSC ↔ ION", delay: 1.15 },
  { key: "burn", label: "Burn", sub: "Dual-chain tracker", delay: 1.3 },
  { key: "domain", label: "Domain", sub: "ION DNS trading", delay: 1.45 },
  { key: "ai", label: "AI", sub: "Market sentinel", delay: 1.6 },
];

const auroraPulse = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.5, 0.8, 0.5],
  },
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: easeInOut,
  },
};

const logoReveal = {
  initial: { scale: 0.3, opacity: 0, filter: "blur(20px)" },
  animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
  transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

const titleReveal = {
  initial: { y: 30, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6, delay: 0.2, ease: easeOut },
};

const subtitleReveal = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.5, delay: 0.35, ease: easeOut },
};

const lineItem = (delay: number) => ({
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.4, delay, ease: easeOut },
});

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"show" | "exit">("show");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("exit"), 3200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase === "exit") {
      const timer = setTimeout(onComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      // noop
    }
  }, []);

  return (
    <AnimatePresence>
      {phase === "show" && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: easeIn }}
        >
          {/* ── Aurora background ── */}
          <div className="pointer-events-none absolute inset-0 bg-[#03050f]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,255,0.28),transparent_45%),radial-gradient(circle_at_20%_75%,rgba(255,59,212,0.18),transparent_35%),linear-gradient(180deg,#03050f_0%,rgba(3,5,15,0.9)_60%,#03050f_100%)]" />
          <motion.div
            className="pointer-events-none absolute left-[-12%] top-[10%] h-[50rem] w-[100rem] rounded-[50%] bg-[linear-gradient(90deg,transparent,rgba(36,247,255,0.4),rgba(141,77,255,0.25),rgba(255,59,212,0.35),transparent)] blur-3xl"
            {...auroraPulse}
          />
          <motion.div
            className="pointer-events-none absolute right-[-18%] top-[-8%] h-[50rem] w-[80rem] rounded-[50%] bg-[radial-gradient(circle,rgba(36,247,255,0.35),rgba(141,77,255,0.2)_42%,transparent_70%)] blur-3xl"
            animate={{
              scale: [1, 1.06, 1],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: easeInOut }}
          />
          {/* particle grid */}
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,255,255,0.9)_1px,transparent_1.2px)] [background-size:36px_36px]" />

          {/* ── Content ── */}
          <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
            {/* Logo */}
            <motion.div className="relative" {...logoReveal}>
              <div className="absolute -inset-6 rounded-full bg-cyan-400/20 blur-2xl" />
              <img
                alt="ION DEX"
                className="relative h-24 w-24 rounded-2xl shadow-[0_0_60px_rgba(36,247,255,0.4)]"
                src="/ion-logo.png"
              />
            </motion.div>

            {/* Title */}
            <motion.div {...titleReveal}>
              <h1 className="text-5xl font-black tracking-tight text-glow-cyan sm:text-6xl">
                ION DEX
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              className="text-sm uppercase tracking-[0.35em] text-cyan-200/55 sm:text-base"
              {...subtitleReveal}
            >
              Trade the future of ION
            </motion.p>

            {/* Business lines grid */}
            <div className="mt-4 grid grid-cols-3 gap-x-8 gap-y-2 sm:grid-cols-5 sm:gap-x-12">
              {businessLines.map((b) => (
                <motion.div
                  key={b.key}
                  className="flex flex-col items-center"
                  {...lineItem(b.delay)}
                >
                  <span className="text-xs font-black tracking-wide text-cyan-200 sm:text-sm">
                    {b.label}
                  </span>
                  <span className="text-[10px] text-cyan-100/35 sm:text-xs">
                    {b.sub}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Bottom glow bar */}
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3], scaleX: [0.4, 1, 0.4] }}
              className="mt-2 h-[2px] w-64 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              transition={{ duration: 2.5, repeat: Infinity, ease: easeInOut }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Returns true if splash should play this session. */
export function shouldShowSplash(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_KEY) !== "1";
  } catch {
    return true;
  }
}
