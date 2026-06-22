import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  bootVideoPath,
  bootVideoSources,
  pickBootVideo,
  readBootViewportHint,
  selectBootVariant,
  type BootClipId,
  type BootVariant,
} from "@/lib/bootVideoCarousel";

const FADE_MS = 520;
const MAX_BOOT_MS = 11_000;
const REDUCED_MOTION_MS = 1_400;
const MIN_SPLASH_HOLD_MS = 3_200;
const MANUAL_SKIP_UNLOCK_MS = 1_400;

type LaunchPhase = "boot" | "exit";

const CLIP_LABELS: Record<BootClipId, string> = {
  cyber: "CYBER AURORA",
  matrix: "NEBULA MATRIX",
  intro: "GALAXY SPIRAL",
};

const CLIP_SUBLINES: Record<BootClipId, string> = {
  cyber: "Aurora glass protocol online",
  matrix: "Nebula routing lattice engaged",
  intro: "Galaxy liquidity gateway aligned",
};

export function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const initial = pickBootVideo();

  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<LaunchPhase>("boot");
  const [clipId] = useState<BootClipId>(initial.clipId);
  const [variant, setVariant] = useState<BootVariant>(initial.variant);
  const [src, setSrc] = useState(initial.src);
  const [useVideo, setUseVideo] = useState(true);

  const sourcesRef = useRef(initial.sources);
  const sourceIndexRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);
  const startedRef = useRef(false);
  const minHoldUntilRef = useRef(Date.now() + MIN_SPLASH_HOLD_MS);
  const manualSkipUnlockRef = useRef(Date.now() + MANUAL_SKIP_UNLOCK_MS);

  const finish = useCallback(() => {
    if (finishedRef.current) return;

    const remainingMs = minHoldUntilRef.current - Date.now();
    if (remainingMs > 0) {
      window.setTimeout(() => {
        if (!finishedRef.current) {
          finish();
        }
      }, remainingMs);
      return;
    }

    finishedRef.current = true;
    setVisible(false);
  }, []);

  const exitSplash = useCallback(() => {
    if (phase === "exit") return;
    setPhase("exit");
    finish();
  }, [finish, phase]);

  useEffect(() => {
    if (document.documentElement.dataset.ionE2eStable === "1") {
      finish();
      return;
    }

    minHoldUntilRef.current = Date.now() + (useVideo ? MIN_SPLASH_HOLD_MS : REDUCED_MOTION_MS);
    manualSkipUnlockRef.current = Date.now() + (useVideo ? MANUAL_SKIP_UNLOCK_MS : 0);

    try {
      if (window.localStorage.getItem("ion-dex-prefer-skip-boot") === "1") {
        finish();
        return;
      }
      sessionStorage.removeItem("ion-dex-skip-boot");
    } catch {
      /* private mode */
    }

    const capMs = useVideo ? MAX_BOOT_MS : REDUCED_MOTION_MS;
    const hardCap = window.setTimeout(() => {
      exitSplash();
    }, capMs);
    return () => window.clearTimeout(hardCap);
  }, [exitSplash, useVideo]);

  useEffect(() => {
    if (!visible) {
      const timer = window.setTimeout(() => onFinish?.(), FADE_MS);
      return () => window.clearTimeout(timer);
    }
    return;
  }, [onFinish, visible]);

  useEffect(() => {
    const syncVariant = () => {
      const hint = readBootViewportHint();
      const next = selectBootVariant(hint);
      if (startedRef.current) return;

      setVariant(next);
      const sources = bootVideoSources(clipId, next);
      sourcesRef.current = sources;
      sourceIndexRef.current = 0;
      setSrc(sources[0] ?? bootVideoPath(clipId, next));
    };

    syncVariant();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => syncVariant();
    mq.addEventListener("change", onMq);
    window.addEventListener("resize", syncVariant);
    window.addEventListener("orientationchange", syncVariant);

    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("resize", syncVariant);
      window.removeEventListener("orientationchange", syncVariant);
    };
  }, [clipId]);

  useEffect(() => {
    if (!useVideo) return;
    const el = videoRef.current;
    if (!el) return;

    const tryPlay = () => {
      void el.play().catch(() => {
        /* autoplay blocked */
      });
    };

    const onPlaying = () => {
      startedRef.current = true;
    };

    el.addEventListener("loadeddata", tryPlay);
    el.addEventListener("playing", onPlaying);
    tryPlay();

    return () => {
      el.removeEventListener("loadeddata", tryPlay);
      el.removeEventListener("playing", onPlaying);
    };
  }, [src, useVideo]);

  const clipLabel = CLIP_LABELS[clipId];
  const clipSubline = CLIP_SUBLINES[clipId];
  const skipReady = Date.now() >= manualSkipUnlockRef.current;
  const exiting = phase === "exit";

  const splash = (
    <motion.div
      animate={{ opacity: visible ? 1 : 0 }}
      className="fixed inset-0 z-[9999] flex min-h-[100dvh] min-h-[100svh] w-full cursor-pointer items-center justify-center overflow-hidden bg-[#010611] before:absolute before:inset-0 before:z-[0] before:bg-[radial-gradient(circle_at_50%_48%,rgba(0,255,255,0.18),transparent_18%),radial-gradient(circle_at_50%_52%,rgba(96,32,255,0.2),transparent_32%),radial-gradient(circle_at_50%_50%,rgba(255,0,255,0.14),transparent_44%),linear-gradient(180deg,rgba(1,6,17,0.76),rgba(1,6,17,0.94))] before:backdrop-blur-[28px] before:content-[''] after:absolute after:inset-0 after:z-[0] after:bg-[#020611]/78 after:content-[''] max-md:pb-[env(safe-area-inset-bottom)] max-md:pt-[env(safe-area-inset-top)]"
      data-boot-clip={clipId}
      data-launch-phase={phase}
      data-boot-variant={variant}
      data-testid="boot-splash-screen"
      onClick={() => {
        if (Date.now() >= manualSkipUnlockRef.current) {
          exitSplash();
        }
      }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && Date.now() >= manualSkipUnlockRef.current) {
          exitSplash();
        }
      }}
      role="presentation"
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {useVideo && !exiting ? (
        <video
          key={src}
          ref={videoRef}
          aria-label="ION DEX startup"
          autoPlay
          className="h-full w-full object-cover object-center opacity-[0.58] saturate-[0.88] brightness-[0.72]"
          muted

          preload="auto"
          src={src}
          onEnded={exitSplash}
          onError={() => {
            const sources = sourcesRef.current;
            const next = sourceIndexRef.current + 1;
            if (next < sources.length) {
              sourceIndexRef.current = next;
              setSrc(sources[next]);
              return;
            }
            exitSplash();
          }}
        />
      ) : (
        <div
          aria-hidden
          className="flex h-full w-full items-center justify-center px-6"
        >
          <div className="boot-fallback-stage relative flex w-full max-w-[28rem] flex-col items-center justify-center overflow-hidden rounded-[30px] border border-cyan-300/30 bg-[rgba(8,14,32,0.42)] px-8 py-12 text-center shadow-[0_0_60px_rgba(0,255,255,0.16),0_0_120px_rgba(141,77,255,0.14)] backdrop-blur-xl">
            <div className="boot-fallback-nebula absolute inset-0" />
            <div className="boot-fallback-grid absolute inset-x-0 bottom-0 h-[40%]" />
            <div className="boot-fallback-orb absolute left-1/2 top-[18%] h-28 w-28 -translate-x-1/2 rounded-full" />
            <div className="relative z-[1] flex h-20 w-20 items-center justify-center rounded-[24px] border border-cyan-300/35 bg-[linear-gradient(135deg,rgba(0,255,255,0.16),rgba(96,32,255,0.28),rgba(255,0,255,0.18))] shadow-[0_0_42px_rgba(0,255,255,0.26)]">
              <img
                alt="ION DEX brand"
                className="h-14 w-14 object-contain drop-shadow-[0_0_24px_rgba(0,255,255,0.42)]"
                src="/brand/ion-dex-logo-master.png"
              />
            </div>
            <p className="relative z-[1] mt-5 text-[11px] font-semibold uppercase tracking-[0.6em] text-cyan-100/75">
              ION DEX
            </p>
            <p className="relative z-[1] mt-3 text-[11px] font-semibold uppercase tracking-[0.58em] text-cyan-100/80">
              GALAXY LIQUIDITY GATEWAY
            </p>
            <h2 className="relative z-[1] mt-4 text-2xl font-semibold tracking-[0.24em] text-white text-glow-cyan sm:text-[2rem]">
              {clipLabel}
            </h2>
            <p className="relative z-[1] mt-3 text-[11px] font-medium uppercase tracking-[0.4em] text-cyan-200/58">
              {clipLabel}
            </p>
            <p className="relative z-[1] mt-3 max-w-[22rem] text-sm font-medium tracking-[0.18em] text-cyan-100/70 sm:text-[15px]">
              {clipSubline}
            </p>
          </div>
        </div>
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_18%,rgba(0,255,255,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(255,0,255,0.16),transparent_26%),radial-gradient(circle_at_20%_80%,rgba(96,32,255,0.18),transparent_28%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#030818]/10 via-transparent to-[#030818]/72"
      />

      <motion.div
        animate={{ opacity: [0.52, 0.92, 0.52], scale: [0.98, 1.03, 0.98] }}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[11%] z-[1] hidden -translate-x-1/2 md:block"
        transition={{ duration: 4.6, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      >
        <div className="rounded-full border border-white/10 bg-[rgba(6,12,30,0.32)] px-5 py-2 backdrop-blur-md shadow-[0_0_30px_rgba(0,255,255,0.16)]">
          <div className="h-3 w-24 rounded-full bg-[linear-gradient(90deg,rgba(0,255,255,0.9),rgba(96,32,255,0.76),rgba(255,0,255,0.88))] shadow-[0_0_22px_rgba(0,255,255,0.26)]" />
        </div>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[18%] z-[1] hidden justify-center md:flex">
        <div className="boot-horizon-grid w-[min(76vw,70rem)]" />
      </div>

      <motion.div
        animate={{ opacity: [0.35, 0.85, 0.35] }}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-[2] hidden h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 md:block"
        transition={{ duration: 3.8, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />

      <motion.div
        animate={{ opacity: [0.2, 0.58, 0.2], scale: [0.95, 1.02, 0.95] }}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-[2] hidden h-[48rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-400/10 md:block"
        transition={{ duration: 5.2, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />

      <motion.div
        animate={{ opacity: [0.22, 0.52, 0.22], scale: [0.92, 1.04, 0.92] }}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-[2] hidden h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.75)_0%,rgba(0,255,255,0.22)_24%,rgba(96,32,255,0.18)_46%,rgba(255,0,255,0.08)_62%,transparent_74%)] blur-[2px] md:block"
        transition={{ duration: 4.2, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-[max(1.25rem,env(safe-area-inset-top))] z-[2] flex justify-center px-4">
        <div className="boot-brand-chip inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-[rgba(4,10,28,0.34)] px-4 py-2 backdrop-blur-md shadow-[0_0_24px_rgba(0,255,255,0.14)]">
          <img
            alt="ION DEX"
            className="h-8 w-8 object-contain drop-shadow-[0_0_18px_rgba(0,255,255,0.36)]"
            src="/brand/ion-dex-logo-master.png"
          />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.52em] text-cyan-100/82">
              ION DEX
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.28em] text-cyan-200/45">
              GALAXY LIQUIDITY GATEWAY
            </span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[2] px-4">
        <div className="mx-auto flex w-full max-w-[54rem] items-center justify-between gap-4 rounded-full border border-cyan-300/15 bg-[rgba(4,10,28,0.26)] px-4 py-2 backdrop-blur-md shadow-[0_0_24px_rgba(0,255,255,0.08)]">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.44em] text-cyan-100/72">
              {clipLabel}
            </p>
            <p className="mt-1 truncate text-[11px] tracking-[0.2em] text-cyan-200/42">
              {clipSubline}
            </p>
          </div>
          <p className="shrink-0 text-[10px] font-medium uppercase tracking-[0.35em] text-cyan-200/40">
            {skipReady ? "点击跳过" : "启动锁定中"}
          </p>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(splash, document.body);
}
