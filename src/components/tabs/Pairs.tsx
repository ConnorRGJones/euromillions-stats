"use client";

import { useState } from "react";
import { draws } from "@/lib/data";
import { N, coMat, sMat } from "@/lib/stats";
import Card, { CardTitle } from "@/components/ui/Card";

export default function Pairs() {
  const [selectedBall, setSelectedBall] = useState(1);
  const [selectedStar, setSelectedStar] = useState(1);

  const ballDrawCount = draws.filter((d) => d[1].includes(selectedBall)).length;
  const ballPairs = Object.entries(coMat[selectedBall] || {})
    .filter(([k]) => +k !== selectedBall)
    .map(([k, v]) => ({ n: +k, count: +v }))
    .sort((a, b) => b.count - a.count);
  const maxBallPair = ballPairs[0]?.count || 1;
  const top3Ball = ballPairs.slice(0, 3).map((p) => `${p.n} (${p.count}×)`).join(", ");

  const starPairs = Object.entries(sMat[selectedStar] || {})
    .filter(([k]) => +k !== selectedStar)
    .map(([k, v]) => ({ n: +k, count: +v }))
    .sort((a, b) => b.count - a.count);
  const maxStarPair = starPairs[0]?.count || 1;
  const top3Star = starPairs.slice(0, 3).map((p) => `LS${p.n} (${p.count}×)`).join(", ");

  const selectStyle = {
    background: "#ffffff",
    border: "1px solid #e5e5e5",
    color: "#3a3a3a",
    appearance: "none" as const,
    paddingRight: 28,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236a6a6a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
  };

  return (
    <div className="pt-6">
      <Card>
        <CardTitle>Main Ball Co-occurrence</CardTitle>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "#6a6a6a" }}>
          Select a ball to see how often each other number appeared in the same draw.
        </p>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <label className="text-xs" style={{ color: "#6a6a6a" }}>Ball:</label>
          <select
            value={selectedBall}
            onChange={(e) => setSelectedBall(+e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg outline-none"
            style={selectStyle}
          >
            {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-xs" style={{ color: "#6a6a6a" }}>in {ballDrawCount} draws</span>
        </div>

        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {ballPairs.map((p) => (
            <div key={p.n} className="flex items-center gap-2">
              <span className="text-xs w-6 text-right shrink-0 tabular-nums" style={{ color: "#6a6a6a" }}>{p.n}</span>
              <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: "#e5e5e5" }}>
                <div className="h-full rounded" style={{ width: `${p.count ? (p.count / maxBallPair) * 100 : 0}%`, background: "linear-gradient(90deg,#3b82f6,#2563eb)" }} />
              </div>
              <span className="text-xs w-6 shrink-0 tabular-nums" style={{ color: "#6a6a6a" }}>{p.count}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl text-xs leading-relaxed" style={{ color: "#6a6a6a", background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.15)" }}>
          Ball {selectedBall}&apos;s top companions: {top3Ball}
        </div>
      </Card>

      <Card>
        <CardTitle>Lucky Star Co-occurrence</CardTitle>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <label className="text-xs" style={{ color: "#6a6a6a" }}>Star:</label>
          <select
            value={selectedStar}
            onChange={(e) => setSelectedStar(+e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg outline-none"
            style={selectStyle}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>LS {n}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          {starPairs.map((p) => (
            <div key={p.n} className="flex items-center gap-2">
              <span className="text-xs w-8 text-right shrink-0" style={{ color: "#6a6a6a" }}>LS{p.n}</span>
              <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: "#e5e5e5" }}>
                <div className="h-full rounded" style={{ width: `${p.count ? (p.count / maxStarPair) * 100 : 0}%`, background: "linear-gradient(90deg,#fbbf24,#d97706)" }} />
              </div>
              <span className="text-xs w-6 shrink-0 tabular-nums" style={{ color: "#6a6a6a" }}>{p.count}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl text-xs leading-relaxed" style={{ color: "#6a6a6a", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)" }}>
          LS{selectedStar} top 3: {top3Star}
        </div>
      </Card>
    </div>
  );
}
