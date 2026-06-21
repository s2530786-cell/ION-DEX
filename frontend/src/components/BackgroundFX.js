import React, { useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

// True 3D dynamic backgrounds: tilted rotating galaxy disk + procedural aurora curtains,
// with multi-layer parallax starfield reacting to pointer movement.
export default function BackgroundFX() {
  const { bg } = useTheme();

  useEffect(() => {
    let frame;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        document.documentElement.style.setProperty("--mx", x.toFixed(3));
        document.documentElement.style.setProperty("--my", y.toFixed(3));
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div className="bgfx" aria-hidden="true">
      <div className="bgfx-scene">
        <div className="bgfx-stars far" />
        <div className="bgfx-stars" />

        <div className={`bgfx-layer ${bg === "galaxy" ? "active" : ""}`}>
          <div className="bgfx-galaxy-tilt">
            <div className="bgfx-galaxy-disk" style={{ backgroundImage: "url(/assets/bg/galaxy.png)" }} />
          </div>
        </div>

        <div className={`bgfx-layer ${bg === "aurora" ? "active" : ""}`}>
          <div className="bgfx-aurora-fx">
            <div className="aurora-band b1" />
            <div className="aurora-band b2" />
            <div className="aurora-band b3" />
            <div className="aurora-band b4" />
          </div>
        </div>
      </div>
      <div className="bgfx-grid" />
      <div className="bgfx-vignette" />
    </div>
  );
}
