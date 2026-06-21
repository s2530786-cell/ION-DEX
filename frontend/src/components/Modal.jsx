import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./kit";

export default function Modal({ open, onClose, title, icon, width = 640, children, testId }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="neon-modal-overlay" onClick={onClose} data-testid={testId ? `${testId}-overlay` : undefined}>
      <div className="neon-modal" style={{ width: `min(94vw, ${width}px)` }} onClick={(e) => e.stopPropagation()} data-testid={testId}>
        <div className="neon-modal-head">
          <div className="flex items-center gap-2">
            {icon && <Icon name={icon} size={22} />}
            <h3 className="h1" style={{ fontSize: 20 }}>{title}</h3>
          </div>
          <button className="neon-modal-close" onClick={onClose} aria-label="Close" data-testid={testId ? `${testId}-close` : "modal-close"}>✕</button>
        </div>
        <div className="neon-modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
