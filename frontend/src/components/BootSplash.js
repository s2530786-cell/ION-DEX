import React, { useState, useRef, useEffect, useMemo } from "react";

const BOOTS = ["/assets/boot/boot1.mp4", "/assets/boot/boot2.mp4"];

export default function BootSplash() {
  // Random pick each full page load -> different every time you open
  const src = useMemo(() => BOOTS[Math.floor(Math.random() * BOOTS.length)], []);
  const skipParam = typeof window !== "undefined" && window.location.search.includes("noboot");
  const [visible, setVisible] = useState(!skipParam);
  const [closing, setClosing] = useState(false);
  const [muted, setMuted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.volume = 1;
    // Try to play WITH sound first; fall back to muted autoplay if blocked
    const p = v.play();
    if (p && p.catch) {
      p.catch(() => {
        v.muted = true;
        setMuted(true);
        v.play().catch(() => {});
      });
    }
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(() => setVisible(false), 700);
  };

  const unmute = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    v.play().catch(() => {});
  };

  if (!visible) return null;

  return (
    <div className={`boot-splash ${closing ? "closing" : ""}`} data-testid="boot-splash">
      <video
        ref={ref}
        src={src}
        autoPlay
        playsInline
        onEnded={close}
        className="boot-video"
        data-testid="boot-video"
      />
      <div className="boot-controls">
        {muted && (
          <button className="ghost-btn" style={{ height: 44 }} onClick={unmute} data-testid="boot-unmute">🔊 开启声音 Sound</button>
        )}
        <button className="neon-btn" style={{ height: 44, width: "auto" }} onClick={close} data-testid="boot-skip">进入 ION DEX →</button>
      </div>
    </div>
  );
}
