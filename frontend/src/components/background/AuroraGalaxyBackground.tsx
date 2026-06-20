import { useEffect, useMemo, useRef } from "react";

const PARTICLE_COUNT = 280;

type Particle = {
  angle: number;
  distance: number;
  radius: number;
  speed: number;
  alpha: number;
  hue: number;
};

export function AuroraGalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundMode = useMemo<"aurora" | "galaxy">(() => {
    return Math.floor(Date.now() / 3_600_000) % 2 === 0 ? "aurora" : "galaxy";
  }, []);

  useEffect(() => {
    if (document.documentElement.dataset.ionE2eStable === "1") {
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }
    const drawingCanvas = canvas;
    const drawingContext = context;

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
      const ring = index % 24;
      return {
        alpha: 0.32 + (index % 9) * 0.04,
        angle: index * 2.399963,
        distance: 90 + ring * 18 + (index % 7) * 8,
        hue: index % 3 === 0 ? 180 : index % 3 === 1 ? 270 : 300,
        radius: 0.75 + (index % 5) * 0.24,
        speed: 0.00018 + (index % 11) * 0.000015,
      };
    });

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let deviceScale = 1;

    function resize() {
      deviceScale = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      drawingCanvas.width = Math.floor(width * deviceScale);
      drawingCanvas.height = Math.floor(height * deviceScale);
      drawingCanvas.style.width = `${width}px`;
      drawingCanvas.style.height = `${height}px`;
      drawingContext.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
    }

    function render(time: number) {
      drawingContext.clearRect(0, 0, width, height);
      const centerX = width * 0.5;
      const centerY = height * 0.48;
      const depthScale = Math.max(width, height) / 1000;

      for (const particle of particles) {
        const angle = particle.angle + time * particle.speed;
        const orbit = particle.distance * depthScale;
        const x = centerX + Math.cos(angle) * orbit * 1.55;
        const y = centerY + Math.sin(angle * 1.7) * orbit * 0.58;
        const pulse = 0.65 + Math.sin(time * 0.0012 + particle.angle) * 0.35;

        drawingContext.beginPath();
        drawingContext.fillStyle = `hsla(${particle.hue}, 100%, 68%, ${particle.alpha * pulse})`;
        drawingContext.shadowColor = `hsla(${particle.hue}, 100%, 62%, 0.82)`;
        drawingContext.shadowBlur = 16;
        drawingContext.arc(x, y, particle.radius * (1 + pulse), 0, Math.PI * 2);
        drawingContext.fill();
      }

      animationFrame = window.requestAnimationFrame(render);
    }

    resize();
    window.addEventListener("resize", resize);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-ion-ink"
    >
      <canvas ref={canvasRef} className="aurora-canvas absolute inset-0 opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(0,255,255,0.18),transparent_30%),radial-gradient(circle_at_18%_82%,rgba(255,0,255,0.16),transparent_28%),linear-gradient(180deg,rgba(1,1,4,0.4)_0%,rgba(1,1,4,0.55)_52%,rgba(1,1,4,0.5)_100%)]" />
      {backgroundMode === "aurora" ? <AuroraLayer /> : <GalaxyLayer />}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,1,4,0.05),rgba(1,1,4,0.35))]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,255,255,0.9)_1px,transparent_1.2px)] [background-size:38px_38px]" />
    </div>
  );
}

function AuroraLayer() {
  return (
    <>
      <div className="ion-bg-aurora-anim absolute left-[-12%] top-[16%] h-[42rem] w-[92rem] rounded-[50%] bg-[linear-gradient(90deg,transparent,rgba(0,255,255,0.28),rgba(96,32,255,0.18),rgba(255,0,255,0.28),transparent)] blur-3xl [animation:ionAuroraFlow_18s_ease-in-out_infinite]" />
      <div className="absolute right-[-22%] top-[-14%] h-[46rem] w-[70rem] rounded-[50%] bg-[radial-gradient(circle,rgba(0,255,255,0.26),rgba(96,32,255,0.14)_42%,transparent_70%)] blur-3xl" />
    </>
  );
}

function GalaxyLayer() {
  return (
    <div className="ion-bg-galaxy-anim absolute left-1/2 top-1/2 h-[64rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 [animation:ionSpinSlow_360s_linear_infinite]">
      {/* Spiral arm 1 — leading cyan */}
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_160deg,transparent,rgba(0,255,255,0.28),transparent_22%,rgba(255,0,255,0.24),transparent_52%,rgba(96,32,255,0.18),transparent_76%)] blur-xl" />
      {/* Spiral arm 2 — offset by 180deg */}
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_340deg,transparent,rgba(0,255,255,0.18),transparent_18%,rgba(255,0,255,0.20),transparent_48%,rgba(96,32,255,0.22),transparent_72%)] blur-lg" />
      {/* Spiral arm 3 — tighter inner spiral */}
      <div className="absolute inset-[15%] rounded-full bg-[conic-gradient(from_250deg,transparent_10%,rgba(0,255,255,0.22)_20%,transparent_30%,rgba(255,0,255,0.16)_45%,transparent_55%,rgba(96,32,255,0.14)_70%,transparent_82%)] blur-md" />
      {/* Core glow */}
      <div className="absolute inset-[28%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22),rgba(0,255,255,0.16)_18%,rgba(96,32,255,0.12)_38%,transparent_62%)]" />
      {/* Starfield dots */}
      <div className="absolute inset-0 rounded-full opacity-60 [background-image:radial-gradient(2px_2px_at_20%_30%,rgba(255,255,255,0.8),transparent),radial-gradient(1.5px_1.5px_at_60%_20%,rgba(0,255,255,0.7),transparent),radial-gradient(2px_2px_at_35%_65%,rgba(255,255,255,0.9),transparent),radial-gradient(1.5px_1.5px_at_75%_55%,rgba(255,0,255,0.6),transparent),radial-gradient(1px_1px_at_50%_45%,rgba(255,255,255,0.7),transparent),radial-gradient(2px_2px_at_12%_75%,rgba(96,32,255,0.8),transparent),radial-gradient(1.5px_1.5px_at_85%_35%,rgba(255,255,255,0.75),transparent),radial-gradient(1px_1px_at_45%_80%,rgba(0,255,255,0.65),transparent)]" />
    </div>
  );
}
