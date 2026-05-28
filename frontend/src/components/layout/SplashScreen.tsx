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



export function SplashScreen({ onFinish }: { onFinish?: () => void }) {

  const initial = pickBootVideo();

  const [visible, setVisible] = useState(true);

  const [clipId] = useState<BootClipId>(initial.clipId);

  const [variant, setVariant] = useState<BootVariant>(initial.variant);

  const [src, setSrc] = useState(initial.src);

  const sourcesRef = useRef(initial.sources);

  const sourceIndexRef = useRef(0);

  /** Boot clip is intentional motion — do not downgrade to static tile on OS reduced-motion. */
  const [useVideo, setUseVideo] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  const finishedRef = useRef(false);

  const startedRef = useRef(false);



  const finish = useCallback(() => {

    if (finishedRef.current) return;

    finishedRef.current = true;

    setVisible(false);

  }, []);



  useEffect(() => {
    if (document.documentElement.dataset.ionE2eStable === "1") {
      finish();
      return;
    }

    try {
      if (window.localStorage.getItem("ion-dex-prefer-skip-boot") === "1") {
        finish();
        return;
      }
      /* Legacy dev console flag — no longer honored so boot video returns after one-time clear. */
      sessionStorage.removeItem("ion-dex-skip-boot");
    } catch {
      /* private mode */
    }

    const capMs = useVideo ? MAX_BOOT_MS : REDUCED_MOTION_MS;

    const hardCap = window.setTimeout(finish, capMs);

    return () => window.clearTimeout(hardCap);

  }, [finish, useVideo]);



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



  const splash = (
    <motion.div
      animate={{ opacity: visible ? 1 : 0 }}
      className="fixed inset-0 z-[200] flex min-h-[100dvh] min-h-[100svh] w-full cursor-pointer items-center justify-center overflow-hidden bg-[#030818] max-md:pb-[env(safe-area-inset-bottom)] max-md:pt-[env(safe-area-inset-top)]"
      data-boot-clip={clipId}
      data-boot-variant={variant}
      data-testid="boot-splash-screen"
      onClick={finish}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") finish();
      }}
      role="presentation"
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >

      {useVideo ? (

        <video

          key={src}

          ref={videoRef}

          aria-label="ION DEX startup"

          autoPlay

          className="h-full w-full object-cover object-center"

          muted

          playsInline

          preload="auto"

          src={src}

          onEnded={finish}

          onError={() => {

            const sources = sourcesRef.current;

            const next = sourceIndexRef.current + 1;

            if (next < sources.length) {

              sourceIndexRef.current = next;

              setSrc(sources[next]);

              return;

            }

            setUseVideo(false);

          }}

        />

      ) : (

        <div

          aria-hidden

          className="flex h-full w-full flex-col items-center justify-center gap-4 px-6"

        >

          <div className="h-16 w-16 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-violet-600/40 to-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.25)]" />

          <p className="text-sm font-semibold tracking-[0.4em] text-cyan-100/80">

            ION DEX

          </p>

        </div>

      )}

      <div

        aria-hidden

        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#030818]/20 via-transparent to-[#030818]/55"

      />

      <p className="pointer-events-none absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-0 right-0 text-center text-[10px] font-medium uppercase tracking-[0.35em] text-cyan-200/35">

        点击跳过 · ION DEX

      </p>

    </motion.div>
  );

  return createPortal(splash, document.body);
}


