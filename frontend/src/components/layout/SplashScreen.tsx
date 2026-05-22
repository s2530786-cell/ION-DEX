import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      animate={{ opacity: visible ? 1 : 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030818]/95 backdrop-blur-sm pointer-events-none"
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
        <div className="text-center">
          {/* Glowing ring */}
          <div className="relative mb-6 inline-flex">
            <div className="absolute inset-0 animate-pulse rounded-full bg-[radial-gradient(circle,var(--neon-primary)_0%,transparent_70%)] opacity-30 blur-xl" />
            <img
              alt="ION DEX"
              className="relative h-24 w-24 rounded-3xl object-cover shadow-[0_0_28px_rgba(36,247,255,0.5)] ring-2 ring-cyan-300/40"
              src="/logo-circular.png"
            />
          </div>

          {/* Title */}
          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black tracking-wider text-glow-cyan"
            initial={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ textShadow: "0 0 32px rgba(36,247,255,0.6)" }}
          >
            ION DEX
          </motion.h1>

          <motion.p
            animate={{ opacity: 1 }}
            className="mt-2 text-sm font-medium text-cyan-200/60 tracking-widest uppercase"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            Decentralized Exchange
          </motion.p>

          {/* Progress bar */}
          <motion.div
            animate={{ width: "80%" }}
            className="mx-auto mt-8 h-[2px] w-48 overflow-hidden rounded-full bg-white/5"
            initial={{ width: "10%" }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400" />
          </motion.div>
        </div>
    </motion.div>
  );
}
