import { AnimatePresence, easeIn, easeInOut, easeOut, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const SPLASH_KEY = "ion-dex-splash-shown";

// ── stable starfield ──
function useStars(n: number) {
  return useMemo(
    () =>
      Array.from({ length: n }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 2.5 + 1,
        twinkle: Math.random() * 2,
      })),
    [],
  );
}

// ── phases ──
type Phase = "cosmic" | "tech" | "transform" | "reveal" | "exit";
const PHASE_TIMES: { phase: Phase; at: number }[] = [
  { phase: "cosmic", at: 0 },
  { phase: "tech", at: 2800 },
  { phase: "transform", at: 5800 },
  { phase: "reveal", at: 7800 },
  { phase: "exit", at: 10000 },
];

// ── color tokens ──
const CY = "rgba(36,247,255,";
const MG = "rgba(255,59,212,";
const VT = "rgba(141,77,255,";
const GD = "rgba(255,209,102,";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const stars = useStars(180);
  const [phase, setPhase] = useState<Phase>("cosmic");

  useEffect(() => {
    const timers = PHASE_TIMES.map(({ phase: p, at }) =>
      setTimeout(() => setPhase(p), at),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === "exit") {
      const t = setTimeout(onComplete, 700);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch { /* noop */ }
  }, []);

  const active = phase !== "exit";
  const isCosmic = phase === "cosmic";
  const isTech = phase === "tech";
  const isTransform = phase === "transform";
  const isReveal = phase === "reveal";
  const beyondCosmic = phase !== "cosmic" && active;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden select-none"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: easeIn }}
        >
          {/* ═══════════════════ BACKGROUND LAYERS ═══════════════════ */}

          {/* deep void */}
          <div className="pointer-events-none absolute inset-0 bg-[#02040c]" />

          {/* ── cosmic nebula auroras ── */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 48% 28%,${CY}0.38),transparent 40%),radial-gradient(circle at 18% 70%,${MG}0.20),transparent 32%),radial-gradient(circle at 72% 55%,${VT}0.18),transparent 30%),linear-gradient(180deg,#02040c 0%,rgba(4,6,18,0.92) 55%,#02040c 100%)`,
            }}
            animate={{
              opacity: isCosmic ? [0.6, 1, 0.8] : beyondCosmic ? [0.4, 0.55] : 0,
            }}
            transition={{ duration: 4, repeat: Infinity, ease: easeInOut }}
          />

          {/* moving aurora ribbons */}
          <motion.div
            className="pointer-events-none absolute left-[-8%] top-[5%] h-[52rem] w-[110rem] rounded-[50%]"
            style={{
              background: `linear-gradient(95deg,transparent,${CY}0.42),${VT}0.28),${MG}0.38),transparent)`,
              filter: "blur(3rem)",
            }}
            animate={{
              opacity: isCosmic ? [0.4, 0.9, 0.55] : isTech ? [0.25, 0.45] : 0,
              scale: isCosmic ? [1, 1.07, 1] : 1,
              rotate: isCosmic ? [0, 3, -2, 0] : 0,
            }}
            transition={{ duration: 6, repeat: Infinity, ease: easeInOut }}
          />
          <motion.div
            className="pointer-events-none absolute right-[-12%] top-[-10%] h-[48rem] w-[90rem] rounded-[50%]"
            style={{
              background: `radial-gradient(circle,${CY}0.38),${VT}0.22) 38%,transparent 65%)`,
              filter: "blur(3.5rem)",
            }}
            animate={{
              opacity: isCosmic ? [0.35, 0.75, 0.45] : isTech ? [0.2, 0.35] : 0,
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 5.5, repeat: Infinity, ease: easeInOut }}
          />

          {/* ═══════════════════ STARFIELD ═══════════════════ */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {stars.map((s, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: s.left,
                  top: s.top,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                }}
                animate={{
                  opacity: isCosmic
                    ? [0.2 + s.twinkle * 0.3, 0.7 + s.twinkle * 0.3, 0.2]
                    : isTech
                      ? [0.1, 0.3 + s.twinkle * 0.2, 0.1]
                      : isTransform
                        ? [0, 0.15, 0]
                        : 0,
                }}
                transition={{
                  duration: 1.5 + s.twinkle,
                  repeat: Infinity,
                  delay: s.twinkle * 0.7,
                  ease: easeInOut,
                }}
              />
            ))}
          </div>

          {/* particle grid (subtle) */}
          <motion.div
            className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.65)_1px,transparent_1.2px)] [background-size:40px_40px]"
            animate={{
              opacity: isCosmic ? 0.08 : isTech ? [0.15, 0.22] : isTransform ? 0.12 : 0,
            }}
            transition={{ duration: 3, ease: easeInOut }}
          />

          {/* ═══════════════════ STAGE 1: COSMIC (0-2.8s) ═══════════════════ */}

          {/* converging particle streams */}
          {isCosmic &&
            [0, 1, 2, 3, 4, 5].map((n) => (
              <motion.div
                key={`stream-${n}`}
                className="pointer-events-none absolute h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                style={{
                  width: `${120 + n * 30}px`,
                  left: `${15 + n * 12}%`,
                  top: `${25 + n * 8}%`,
                  rotate: `${-15 + n * 6}deg`,
                }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: [0, 1, 0.5], scaleX: [0, 1, 0.8] }}
                transition={{
                  duration: 2.5,
                  delay: 0.2 + n * 0.15,
                  ease: easeOut,
                }}
              />
            ))}

          {/* ═══════════════════ STAGE 2: TECH (2.8-5.8s) ═══════════════════ */}

          {/* concentric glass rings */}
          {beyondCosmic && (
            <>
              <motion.div
                className="pointer-events-none absolute rounded-full border"
                style={{
                  borderColor: `${CY}0.25)`,
                  width: "340px",
                  height: "340px",
                  boxShadow: `0 0 40px ${CY}0.15),inset 0 0 40px ${CY}0.08)`,
                  backdropFilter: "blur(8px)",
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: isTech ? [0.3, 1] : 1,
                  opacity: isTech ? [0, 0.7] : 0.5,
                  rotate: [0, 360],
                }}
                transition={{
                  scale: { duration: 1.2, delay: 0.1 },
                  opacity: { duration: 1.2, delay: 0.1 },
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                }}
              />
              <motion.div
                className="pointer-events-none absolute rounded-full border"
                style={{
                  borderColor: `${MG}0.22)`,
                  width: "260px",
                  height: "260px",
                  boxShadow: `0 0 30px ${MG}0.12)`,
                  backdropFilter: "blur(6px)",
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: isTech ? [0.5, 1] : 1,
                  opacity: isTech ? [0, 0.55] : 0.4,
                  rotate: [0, -360],
                }}
                transition={{
                  scale: { duration: 1.0, delay: 0.3 },
                  opacity: { duration: 1.0, delay: 0.3 },
                  rotate: { duration: 18, repeat: Infinity, ease: "linear" },
                }}
              />
            </>
          )}

          {/* wireframe cube (SVG) — tech phase */}
          {isTech && (
            <motion.svg
              width="80"
              height="80"
              viewBox="0 0 100 100"
              className="pointer-events-none absolute"
              style={{ zIndex: 5 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={{
                scale: { duration: 0.7, delay: 0.8 },
                opacity: { duration: 0.7, delay: 0.8 },
              }}
            >
              {/* rotation wrapper */}
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "50px 50px" }}
              >
                {/* front face */}
                <motion.rect
                  x="25" y="25" width="50" height="50"
                  fill="none"
                  stroke={`${CY}0.7)`}
                  strokeWidth="1.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.9, ease: easeOut }}
                />
                {/* back face offset */}
                <motion.rect
                  x="15" y="35" width="50" height="50"
                  fill="none"
                  stroke={`${MG}0.5)`}
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 1.1, ease: easeOut }}
                />
                {/* connectors */}
                <motion.path
                  d="M25,25 L15,35" fill="none"
                  stroke={`${VT}0.5)`} strokeWidth="0.8"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 1.3, ease: easeOut }}
                />
                <motion.path
                  d="M25,75 L15,85" fill="none"
                  stroke={`${VT}0.5)`} strokeWidth="0.8"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 1.4, ease: easeOut }}
                />
                <motion.path
                  d="M75,25 L65,35" fill="none"
                  stroke={`${VT}0.5)`} strokeWidth="0.8"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 1.5, ease: easeOut }}
                />
                <motion.path
                  d="M75,75 L65,85" fill="none"
                  stroke={`${VT}0.5)`} strokeWidth="0.8"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 1.6, ease: easeOut }}
                />
                {/* cross-diagonals (dashed) */}
                <motion.line
                  x1="25" y1="25" x2="75" y2="75"
                  stroke={`${CY}0.2)`} strokeWidth="0.5"
                  strokeDasharray="4,4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0.2] }}
                  transition={{ duration: 2, delay: 1.8, repeat: Infinity, ease: easeInOut }}
                />
                <motion.line
                  x1="75" y1="25" x2="25" y2="75"
                  stroke={`${CY}0.2)`} strokeWidth="0.5"
                  strokeDasharray="4,4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0.2] }}
                  transition={{ duration: 2, delay: 1.9, repeat: Infinity, ease: easeInOut }}
                />
              </motion.g>
            </motion.svg>
          )}

          {/* data streams (tech phase) */}
          {isTech &&
            [0, 1, 2, 3].map((n) => {
              const colors = [CY, MG, VT, CY];
              return (
                <motion.div
                  key={`ds-${n}`}
                  className="pointer-events-none absolute h-[1px] rounded-full"
                  style={{
                    background: `linear-gradient(90deg,transparent,${colors[n]}0.7),transparent)`,
                    width: `${220 + n * 40}px`,
                    top: `${35 + n * 10}%`,
                    left: `${15 + n * 8}%`,
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{
                    scaleX: [0, 1, 0.6],
                    opacity: [0, 0.8, 0.3],
                    y: [0, n % 2 === 0 ? -8 : 8, 0],
                  }}
                  transition={{
                    duration: 1.8,
                    delay: 0.3 + n * 0.25,
                    repeat: Infinity,
                    ease: easeInOut,
                  }}
                />
              );
            })}

          {/* business-line labels (tech phase) */}
          {isTech && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
              <div className="grid grid-cols-3 gap-x-10 gap-y-3 text-center">
                {([
                  { label: "Swap", sub: "ION ↔ BNB", color: CY, shadow: "0 0 10px rgba(36,247,255,0.4)" },
                  { label: "Trade", sub: "Limit orders", color: MG, shadow: "0 0 10px rgba(255,59,212,0.4)" },
                  { label: "Grid", sub: "Spot strategies", color: VT, shadow: "0 0 10px rgba(141,77,255,0.4)" },
                  { label: "Pool", sub: "Liquidity", color: CY, shadow: "0 0 10px rgba(36,247,255,0.4)" },
                  { label: "Stake", sub: "12% APY", color: GD, shadow: "0 0 10px rgba(255,209,102,0.4)" },
                  { label: "Bridge", sub: "BSC ↔ ION", color: MG, shadow: "0 0 10px rgba(255,59,212,0.4)" },
                  { label: "Burn", sub: "Dual-chain", color: VT, shadow: "0 0 10px rgba(141,77,255,0.4)" },
                  { label: "Domain", sub: "ION DNS", color: CY, shadow: "0 0 10px rgba(36,247,255,0.4)" },
                  { label: "AI", sub: "Sentinel", color: GD, shadow: "0 0 10px rgba(255,209,102,0.4)" },
                ] as const).map((b, i) => (
                  <motion.div
                    key={b.label}
                    className="flex flex-col items-center"
                    initial={{ y: 15, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.5 + i * 0.12, ease: easeOut }}
                  >
                    <motion.span
                      className="text-xs font-black tracking-wider"
                      style={{
                        color: `${b.color}0.9)`,
                        textShadow: b.shadow,
                      }}
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.5 + i * 0.1, repeat: Infinity, ease: easeInOut }}
                    >
                      {b.label}
                    </motion.span>
                    <span className="text-[9px] text-white/25 mt-0.5">
                      {b.sub}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════ STAGE 3: TRANSFORM (5.8-7.8s) ═══════════════════ */}

          {/* sweeping energy rings collapsing inward */}
          {isTransform &&
            (([
              { size: 400, color: CY, delay: 0 },
              { size: 320, color: MG, delay: 0.15 },
              { size: 240, color: VT, delay: 0.3 },
            ] as const).map((r, i) => (
              <motion.div
                key={`ring-${i}`}
                className="pointer-events-none absolute rounded-full border-2"
                style={{
                  borderColor: `${r.color}0.5)`,
                  width: `${r.size}px`,
                  height: `${r.size}px`,
                  boxShadow: `0 0 35px ${r.color}0.2)`,
                }}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.2, 1.2], opacity: [0, 0.9, 0.4, 0] }}
                transition={{
                  duration: 1.8,
                  delay: r.delay,
                  ease: easeOut,
                  repeat: 1,
                }}
              />
            )))}

          {/* ═══════════════════ STAGE 4: REVEAL (7.8-10s) ═══════════════════ */}

          {/* logo reveal */}
          <div className="relative z-20 flex flex-col items-center gap-5 px-6">
            {/* glow aura behind logo */}
            <motion.div
              className="absolute -inset-16 rounded-full blur-3xl"
              style={{
                background: `radial-gradient(circle,${CY}0.35),${VT}0.2) 40%,transparent 65%)`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={
                isReveal
                  ? { opacity: [0, 1], scale: [0.3, 1.5], transition: { duration: 0.8, ease: easeOut } }
                  : { opacity: 0, scale: 0 }
              }
            />

            {/* logo image */}
            <motion.div
              className="relative"
              initial={{ scale: 0, opacity: 0, filter: "blur(16px)" }}
              animate={
                isReveal
                  ? { scale: 1, opacity: 1, filter: "blur(0px)" }
                  : isTransform
                    ? { scale: [0, 0.6], opacity: [0, 0.5], filter: "blur(8px)" }
                    : { scale: 0, opacity: 0, filter: "blur(16px)" }
              }
              transition={
                isReveal
                  ? { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
                  : { duration: 0.6, ease: easeOut }
              }
            >
              <motion.div
                className="absolute -inset-4 rounded-2xl blur-xl"
                style={{ background: `${CY}0.2)` }}
                animate={
                  isReveal
                    ? { opacity: [0.3, 1, 0.7], scale: [0.8, 1.3, 1] }
                    : { opacity: 0.2 }
                }
                transition={{ duration: 2, repeat: Infinity, ease: easeInOut }}
              />
              <img
                alt="ION DEX"
                className="relative h-24 w-24 rounded-2xl"
                style={{
                  boxShadow: isReveal
                    ? "0 0 80px rgba(36,247,255,0.5),0 0 200px rgba(36,247,255,0.15)"
                    : "0 0 20px rgba(36,247,255,0.2)",
                }}
                src="/ion-logo.png"
              />
            </motion.div>

            {/* title */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={isReveal ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
            >
              <motion.h1
                className="text-5xl font-black tracking-tight sm:text-6xl"
                style={{
                  color: "white",
                  textShadow: "0 0 30px rgba(36,247,255,0.6),0 0 60px rgba(36,247,255,0.3)",
                }}
                animate={
                  isReveal
                    ? {
                        scale: [1, 1.04, 1],
                        textShadow: [
                          "0 0 30px rgba(36,247,255,0.6),0 0 60px rgba(36,247,255,0.3)",
                          "0 0 50px rgba(36,247,255,0.9),0 0 100px rgba(36,247,255,0.5)",
                          "0 0 30px rgba(36,247,255,0.6),0 0 60px rgba(36,247,255,0.3)",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 3, repeat: Infinity, ease: easeInOut }}
              >
                ION DEX
              </motion.h1>
            </motion.div>

            {/* subtitle */}
            <motion.div
              initial={{ y: 25, opacity: 0 }}
              animate={isReveal ? { y: 0, opacity: 1 } : { y: 25, opacity: 0 }}
              transition={{ duration: 0.45, delay: 0.55, ease: easeOut }}
            >
              <p
                className="text-sm uppercase tracking-[0.32em] sm:text-base"
                style={{ color: `${CY}0.65)` }}
              >
                Trade the future of ION
              </p>
            </motion.div>

            {/* pulsing underline */}
            <motion.div
              className="h-[2px] w-56 rounded-full"
              style={{
                background: `linear-gradient(90deg,transparent,${CY}0.8),${VT}0.5),transparent)`,
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={
                isReveal
                  ? {
                      scaleX: [0, 1],
                      opacity: [0, 1],
                      transition: { duration: 0.8, delay: 0.7, ease: easeOut },
                    }
                  : {}
              }
            />
            {isReveal && (
              <motion.div
                className="h-[2px] w-56 rounded-full mt-0"
                style={{
                  background: `linear-gradient(90deg,transparent,${CY}0.8),${VT}0.5),transparent)`,
                }}
                animate={{ opacity: [0.4, 1, 0.4], scaleX: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: easeInOut }}
              />
            )}
          </div>

          {/* outermost glow flare (reveal phase) */}
          {isReveal && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 50% 45%,${CY}0.08),transparent 55%)`,
              }}
              animate={{ opacity: [0, 1, 0.7, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: easeInOut }}
            />
          )}
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
