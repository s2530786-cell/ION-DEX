import { useEffect, useMemo, useRef } from "react";

const PARTICLE_COUNT = 240;

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
        alpha: 0.28 + (index % 9) * 0.035,
        angle: index * 2.399963,
        distance: 90 + ring * 18 + (index % 7) * 8,
        hue: index % 3 === 0 ? 186 : index % 3 === 1 ? 286 : 315,
        radius: 0.7 + (index % 5) * 0.22,
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
        drawingContext.shadowColor = `hsla(${particle.hue}, 100%, 62%, 0.72)`;
        drawingContext.shadowBlur = 14;
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
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#03050f]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(37,99,255,0.22),transparent_32%),radial-gradient(circle_at_20%_85%,rgba(255,59,212,0.18),transparent_28%),linear-gradient(180deg,#03050f_0%,rgba(3,5,15,0.94)_52%,#03050f_100%)]" />
      {backgroundMode === "aurora" ? <AuroraLayer /> : <GalaxyLayer />}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,5,15,0.04),rgba(3,5,15,0.52))]" />
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
