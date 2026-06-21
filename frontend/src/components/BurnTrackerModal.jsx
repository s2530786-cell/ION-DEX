import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import NeonAreaChart from "./NeonAreaChart";
import { Loader, Badge } from "./kit";
import { api, fmt } from "../lib/api";

export default function BurnTrackerModal({ open, onClose }) {
  const [burn, setBurn] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { if (open && !burn) api.burnStats().then(setBurn); }, [open, burn]);

  const dayPct = burn ? Math.min((burn.day_burned / 500000) * 100, 100) : 0;

  return (
    <Modal open={open} onClose={onClose} title="Burn Tracker" icon="burn.svg" width={760} testId="burn-modal">
      {!burn ? <Loader /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="neon-stat-box">
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Total Burned</div>
              <div className="stat-mono" style={{ fontSize: 34, color: "var(--magenta)", lineHeight: 1.1 }} data-testid="burn-total">{fmt(burn.total_burned)}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>ION</div>
            </div>
            <div className="neon-stat-box">
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Today Burned</div>
              <div className="stat-mono" style={{ fontSize: 34, color: "var(--gold)", lineHeight: 1.1 }} data-testid="burn-today">{fmt(burn.day_burned)}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>ION</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge color={burn.market_phase === "bull" ? "var(--green)" : "var(--red)"}>{burn.market_phase} market</Badge>
            <Badge color="var(--magenta)">Dynamic burn {burn.burn_rate}%</Badge>
            <Badge color="var(--cyan)">ION ${burn.ion_price}</Badge>
          </div>

          <div>
            <div className="flex justify-between mb-2" style={{ fontSize: 12, color: "var(--text-dim)" }}>
              <span>7-Day Burn Trend</span>
              <span className="mono" style={{ color: "var(--gold)" }}>Daily target 500K</span>
            </div>
            <NeonAreaChart data={burn.history || []} height={220} />
          </div>

          <div>
            <div className="flex justify-between mb-2" style={{ fontSize: 12, color: "var(--text-dim)" }}>
              <span>Today vs Daily Target</span>
              <span className="mono" style={{ color: "var(--magenta)" }}>{dayPct.toFixed(1)}%</span>
            </div>
            <div style={{ height: 12, background: "var(--input-bg)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${dayPct}%`, height: "100%", background: "linear-gradient(90deg,#00F5FF,#9D4EDD,#FF007A)", boxShadow: "0 0 16px rgba(255,0,122,0.5)" }} />
            </div>
          </div>

          <button className="ghost-btn w-full" style={{ height: 46 }} onClick={() => { onClose(); navigate("/dashboard"); }} data-testid="burn-modal-dashboard">
            查看完整仪表盘 →
          </button>
        </div>
      )}
    </Modal>
  );
}
