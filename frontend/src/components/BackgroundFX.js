import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

export const SCENES = [
  { id: "iceland", img: "/assets/bg/scene_iceland.jpg", name: "Iceland Aurora" },
  { id: "santorini", img: "/assets/bg/scene_santorini.jpg", name: "Santorini" },
  { id: "fuji", img: "/assets/bg/scene_fuji.jpg", name: "Mount Fuji" },
  { id: "dubai", img: "/assets/bg/scene_dubai.jpg", name: "Dubai" },
  { id: "swiss", img: "/assets/bg/scene_swiss.jpg", name: "Swiss Alps" },
  { id: "maldives", img: "/assets/bg/scene_maldives.jpg", name: "Maldives" },
  { id: "zhangjiajie", img: "/assets/bg/scene_zhangjiajie.jpg", name: "Zhangjiajie" },
  { id: "banff", img: "/assets/bg/scene_banff.jpg", name: "Moraine Lake" },
  { id: "sahara", img: "/assets/bg/scene_sahara.jpg", name: "Sahara" },
  { id: "guilin", img: "/assets/bg/scene_guilin.jpg", name: "Guilin" },
  { id: "norway", img: "/assets/bg/scene_norway.jpg", name: "Norway Fjord" },
  { id: "nz", img: "/assets/bg/scene_nz.jpg", name: "Milford Sound" },
  { id: "bora", img: "/assets/bg/scene_bora.jpg", name: "Bora Bora" },
  { id: "patagonia", img: "/assets/bg/scene_patagonia.jpg", name: "Patagonia" },
  { id: "tuscany", img: "/assets/bg/scene_tuscany.jpg", name: "Tuscany" },
  { id: "louise", img: "/assets/bg/scene_louise.jpg", name: "Lake Louise" },
  { id: "antelope", img: "/assets/bg/scene_antelope.jpg", name: "Antelope Canyon" },
  { id: "halong", img: "/assets/bg/scene_halong.jpg", name: "Halong Bay" },
  { id: "plitvice", img: "/assets/bg/scene_plitvice.jpg", name: "Plitvice Lakes" },
  { id: "cappadocia", img: "/assets/bg/scene_cappadocia.jpg", name: "Cappadocia" },
];

// 3D dynamic world-scenery slideshow (Ken-Burns + pointer parallax) with procedural aurora alt.
export default function BackgroundFX() {
  const { bg } = useTheme();
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * SCENES.length));

  // cycle scenes every 11s when scenery mode is active
  useEffect(() => {
    if (bg !== "scenery") return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SCENES.length), 11000);
    return () => clearInterval(t);
  }, [bg]);

  // pointer parallax
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

        <div className={`bgfx-layer ${bg === "scenery" ? "active" : ""}`}>
          <div className="bgfx-scenery">
            {SCENES.map((s, i) => (
              <div
                key={s.id}
                className={`bgfx-scene-img ${i === idx ? "active" : ""}`}
                style={{ backgroundImage: `url(${s.img})` }}
              />
            ))}
          </div>
          <div className="bgfx-neon" />
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
