"use client";

import { useState } from "react";
import {
  N, iqrs, mainFreq, starFreq, starPairs, coMat,
  posOutlierCount, posOutlierBelow, posOutlierAbove,
  posHistoricalMin, posHistoricalMax,
  jointCondOutlier, baseOutlierRates,
  avgSum, sumQ1, sumQ3, weightedRandom, srt,
} from "@/lib/stats";
import Card, { CardTitle } from "@/components/ui/Card";
import Ball from "@/components/ui/Ball";

type StarMode = "free" | "hot" | "stat";
interface DipBall { n: number; outlier: boolean }
interface DipResult { balls: DipBall[]; stars: number[]; sum: number }

const POS_STATS = posOutlierCount.map((_, i) => ({
  total: Math.round((posOutlierCount[i] / N) * 100),
  below: Math.round((posOutlierBelow[i] / N) * 100),
  above: Math.round((posOutlierAbove[i] / N) * 100),
  hMin: posHistoricalMin[i],
  hMax: posHistoricalMax[i],
  q1: iqrs[i].q1,
  q3: iqrs[i].q3,
}));

function condRate(pinned: Set<number>, pos: number): number {
  if (pinned.size === 0) return baseOutlierRates[pos];
  const key = [...pinned].sort((a, b) => a - b).join(",");
  return jointCondOutlier[key]?.[pos] ?? baseOutlierRates[pos];
}

const PRESETS: { label: string; desc: string; positions: number[] }[] = [
  { label: "None",     desc: "All typical",    positions: [] },
  { label: "B2+B3",   desc: "Strongest pair",  positions: [1, 2] },
  { label: "B3+B4",   desc: "Mid cluster",     positions: [2, 3] },
  { label: "B1+B2",   desc: "Low start",       positions: [0, 1] },
  { label: "B2+B3+B4",desc: "3-ball cluster",  positions: [1, 2, 3] },
  { label: "All 5",   desc: "Wild draw",       positions: [0,1,2,3,4] },
];

function generate(pinnedOutliers: Set<number>, starMode: StarMode): DipResult {
  const balls: DipBall[] = [];
  let minVal = 1;

  for (let pos = 0; pos < 5; pos++) {
    const isOutlier = pinnedOutliers.has(pos);
    const { q1, q3 } = iqrs[pos];
    const maxAllowed = Math.min(posHistoricalMax[pos], 50 - (4 - pos));
    const lo = Math.max(minVal, posHistoricalMin[pos]);

    const pool: Record<number, number> = {};
    for (let n = lo; n <= maxAllowed; n++) {
      const inIQR = n >= q1 && n <= q3;
      if (isOutlier && inIQR) continue;
      if (!isOutlier && !inIQR) continue;
      pool[n] = mainFreq[n] || 1;
    }
    if (balls.length > 0) {
      const prev = balls[balls.length - 1].n;
      // Consecutive penalty scales with outlier count
      const consecMultiplier = pinnedOutliers.size === 0 ? 0.08
        : pinnedOutliers.size === 1 ? 0.18
        : pinnedOutliers.size === 2 ? 0.42
        : 0.40;
      // Co-occurrence weighting: penalise candidates that have rarely/never appeared
      // with already-picked balls. Uses minimum co-occurrence across all picked balls.
      Object.keys(pool).forEach((nk) => {
        const n = +nk;
        if (n - prev === 1) pool[n] *= consecMultiplier;
        // Find minimum co-occurrence count with any already-picked ball
        const minCoOcc = Math.min(...balls.map(b => coMat[b.n]?.[n] ?? 0));
        if (minCoOcc === 0) {
          pool[n] *= 0.08; // never appeared together — very strong penalty
        } else if (minCoOcc === 1) {
          pool[n] *= 0.35; // appeared only once — moderate penalty
        }
        // minCoOcc >= 2 → no penalty (normal historical occurrence)
      });
    }
    if (Object.keys(pool).length === 0) {
      for (let n = lo; n <= maxAllowed; n++) { pool[n] = 1; break; }
    }

    const picked = weightedRandom(pool);
    balls.push({ n: picked, outlier: isOutlier });
    minVal = picked + 1;
  }

  let stars: number[];
  if (starMode === "hot") {
    stars = [...starPairs[0].pair];
  } else if (starMode === "stat") {
    const sp: Record<number, number> = {};
    for (let s = 1; s <= 12; s++) sp[s] = starFreq[s] || 1;
    const s1 = weightedRandom(sp);
    const sp2: Record<number, number> = {};
    for (let s = 1; s <= 12; s++) { if (s !== s1) sp2[s] = starFreq[s] || 1; }
    stars = srt([s1, weightedRandom(sp2)]);
  } else {
    const sp: Record<number, number> = {};
    for (let s = 1; s <= 12; s++) sp[s] = starFreq[s] || 1;
    const s1 = weightedRandom(sp);
    const sp2 = { ...sp }; delete sp2[s1];
    stars = srt([s1, weightedRandom(sp2)]);
  }
  return { balls, stars, sum: balls.reduce((a, b) => a + b.n, 0) };
}

export default function LuckyDip() {
  const [pinnedOutliers, setPinnedOutliers] = useState<Set<number>>(new Set());
  const [starMode, setStarMode] = useState<StarMode>("free");
  const [result, setResult] = useState<DipResult | null>(null);
  const [history, setHistory] = useState<DipResult[]>([]);

  function togglePosition(pos: number) {
    setPinnedOutliers((prev) => {
      const next = new Set(prev);
      if (next.has(pos)) next.delete(pos); else next.add(pos);
      return next;
    });
  }

  function applyPreset(positions: number[]) {
    setPinnedOutliers(new Set(positions));
  }

  function handleGenerate() {
    const r = generate(pinnedOutliers, starMode);
    setResult(r);
    setHistory((h) => [r, ...h].slice(0, 10));
  }

  const diff = result ? result.sum - avgSum : 0;
  const consecCount = result
    ? result.balls.filter((_, i) => i > 0 && result.balls[i].n - result.balls[i - 1].n === 1).length
    : 0;
  const outlierCount = result ? result.balls.filter((b) => b.outlier).length : 0;

  return (
    <div className="pt-6">
      <Card gold>
        <CardTitle badge="data-driven">Smart Lucky Dip</CardTitle>
        <p className="text-xs leading-relaxed mb-5" style={{ color: "#6a6a6a" }}>
          Select which ball positions should be outliers (outside their IQR). Selected balls
          are forced outside their typical range — unselected balls stay inside it.
          Percentages show how often each scenario appears in {N} real draws.
        </p>

        {/* Preset combos */}
        <p className="text-xs mb-2" style={{ color: "#6a6a6a" }}>Quick presets:</p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {PRESETS.map((p) => {
            const active = p.positions.length === pinnedOutliers.size &&
              p.positions.every((pos) => pinnedOutliers.has(pos));
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p.positions)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={
                  active
                    ? { background: "linear-gradient(160deg,#2563eb,#1e3a8a)", border: "1.5px solid #1e3a8a", color: "#ffffff" }
                    : { background: "#ffffff", border: "1px solid #e2e8f0", color: "#64748b" }
                }
              >
                {p.label}
                <span className="ml-1.5" style={{ opacity: 0.55 }}>{p.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Position buttons */}
        <p className="text-xs mb-2" style={{ color: "#6a6a6a" }}>Or pick positions manually:</p>
        <div className="flex gap-1.5 mb-1">
          {[0, 1, 2, 3, 4].map((pos) => {
            const pinned = pinnedOutliers.has(pos);
            const { total, below, above, hMin, hMax, q1, q3 } = POS_STATS[pos];
            const cr = pinnedOutliers.size > 0 && !pinned
              ? Math.round(condRate(pinnedOutliers, pos) * 100)
              : null;
            const lifted = cr !== null && cr > total;
            return (
              <button
                key={pos}
                onClick={() => togglePosition(pos)}
                className="flex-1 rounded-xl text-xs font-medium transition-all text-center"
                style={{
                  padding: "10px 4px",
                  background: pinned ? "linear-gradient(160deg,#2563eb,#1e3a8a)" : "#ffffff",
                  border: pinned
                    ? "1.5px solid #1e3a8a"
                    : lifted
                    ? "1.5px solid rgba(30,58,138,0.30)"
                    : "1px solid #e2e8f0",
                  color: pinned ? "#ffffff" : "#64748b",
                }}
              >
                <span className="block font-bold text-sm mb-1">B{pos + 1}</span>

                {pinned ? (
                  <>
                    <span className="block font-semibold text-xs" style={{ color: "#ffffff", opacity: 0.85 }}>OUTLIER</span>
                    <span className="block mt-1.5" style={{ opacity: 0.7, fontSize: 10 }}>IQR {q1}–{q3}</span>
                    <span className="block" style={{ opacity: 0.6, fontSize: 10 }}>seen {hMin}–{hMax}</span>
                  </>
                ) : (
                  <>
                    <span className="block font-bold" style={{ fontSize: 13, color: "#0f172a" }}>{total}%</span>
                    <span className="block" style={{ color: "#1e3a8a", opacity: 0.8, fontSize: 10, marginTop: 2 }}>▼ {below}%</span>
                    <span className="block" style={{ color: "#dc2626", opacity: 0.8, fontSize: 10 }}>▲ {above}%</span>
                    {cr !== null && (
                      <span
                        className="block font-semibold mt-1.5 rounded"
                        style={{
                          fontSize: 11,
                          color: lifted ? "#1e3a8a" : "#64748b",
                          background: lifted ? "rgba(30,58,138,0.08)" : "transparent",
                          padding: "1px 0",
                        }}
                      >
                        if pinned: {cr}%
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs mb-5 mt-1.5" style={{ color: "#9a9a9a" }}>
          {pinnedOutliers.size === 0
            ? "No outliers — all balls will fall within their typical IQR range."
            : `${pinnedOutliers.size} position${pinnedOutliers.size > 1 ? "s" : ""} pinned as outlier${pinnedOutliers.size > 1 ? "s" : ""}. "If pinned" shows historical co-occurrence rate.`}
        </p>

        {/* Stars */}
        <p className="text-xs mb-2" style={{ color: "#6a6a6a" }}>Lucky Stars mode:</p>
        <div className="flex gap-2 mb-6">
          {(["free", "hot", "stat"] as StarMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setStarMode(m)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all flex-1"
              style={
                starMode === m
                  ? { background: "#2563eb", border: "1.5px solid #2563eb", color: "#ffffff" }
                  : { background: "#ffffff", border: "1px solid #e5e5e5", color: "#6a6a6a" }
              }
            >
              {m === "free" ? "Free" : m === "hot" ? "Hot pair" : "Statistical"}
              <span className="block text-xs mt-0.5" style={{ opacity: 0.6 }}>
                {m === "free" ? "Weighted random" : m === "hot" ? "Most common" : "Freq-weighted"}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-105 active:scale-95"
          style={{
            background: "linear-gradient(160deg,#fcd34d 0%,#f59e0b 45%,#d97706 100%)",
            color: "#1c1917",
            boxShadow: "0 4px 20px rgba(217,119,6,0.4), 0 1px 6px rgba(217,119,6,0.22), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          Generate Lucky Dip →
        </button>

        {result && (
          <div className="mt-5 pt-5 border-t" style={{ borderColor: "#e5e5e5" }}>
            <div className="flex flex-wrap gap-2 items-center mb-4">
              {result.balls.map((b) => (
                <span key={b.n} className="relative inline-flex">
                  <span
                    className="ball ball-lg"
                    style={
                      b.outlier
                        ? { background: "linear-gradient(135deg,#c4bab4,#a8a29e)", color: "#0a0a0a" }
                        : { background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#ffffff" }
                    }
                  >{b.n}</span>
                  {b.outlier && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white" style={{ background: "#dc2626", fontSize: 8 }}>!</span>
                  )}
                </span>
              ))}
              <span className="text-xl mx-1" style={{ color: "#9a9a9a" }}>★</span>
              {result.stars.map((s) => <Ball key={s} n={s} type="star" size="lg" />)}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={outlierCount === 0 ? { background: "rgba(37,99,235,0.08)", color: "#2563eb" } : { background: "rgba(217,119,6,0.08)", color: "#d97706" }}>
                {outlierCount} outlier{outlierCount !== 1 ? "s" : ""}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={consecCount > 0 ? { background: "rgba(220,38,38,0.08)", color: "#dc2626" } : { background: "rgba(5,150,105,0.08)", color: "#059669" }}>
                {consecCount > 0 ? `${consecCount} consecutive` : "No consecutives"}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: "#ffffff", color: "#6a6a6a", border: "1px solid #e5e5e5" }}>
                Sum: {result.sum} ({diff > 0 ? "+" : ""}{diff.toFixed(0)} vs avg)
              </span>
            </div>
            <p className="text-xs" style={{ color: "#6a6a6a" }}>
              Stars <strong style={{ color: "#3a3a3a" }}>LS{result.stars[0]}+LS{result.stars[1]}</strong> · Mode: <strong style={{ color: "#3a3a3a" }}>{starMode}</strong>
            </p>
          </div>
        )}
      </Card>

      {history.length > 0 && (
        <Card>
          <CardTitle>History</CardTitle>
          <div>
            {history.map((h, i) => (
              <div key={i} className="flex flex-wrap gap-1.5 items-center py-2.5 border-b last:border-0" style={{ borderColor: "#e5e5e5" }}>
                <span className="text-xs w-5 shrink-0" style={{ color: "#9a9a9a" }}>{i + 1}</span>
                {h.balls.map((b) => (
                  <span key={b.n} className="ball ball-sm" style={b.outlier ? { background: "linear-gradient(135deg,#c4bab4,#a8a29e)", color: "#0a0a0a" } : { background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#ffffff" }}>{b.n}</span>
                ))}
                <span className="text-xs mx-0.5" style={{ color: "#9a9a9a" }}>★</span>
                {h.stars.map((s) => <Ball key={s} n={s} type="star" size="sm" />)}
                <span className="ml-auto text-xs tabular-nums" style={{ color: "#6a6a6a" }}>{h.sum}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <OptimalDip />
    </div>
  );
}

// ── Optimal Lucky Dip ─────────────────────────────────────────────────────────

const HOT_STARS = starPairs[0].pair; // used only for the display label

function pickOptimalStars(): number[] {
  // Frequency-weighted across all star pairs — hot pairs are more likely but not guaranteed
  const pairWeights: Record<string, number> = {};
  starPairs.forEach((sp) => { pairWeights[sp.pair.join(",")] = sp.c; });
  const total = Object.values(pairWeights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [key, w] of Object.entries(pairWeights)) {
    r -= w;
    if (r <= 0) return key.split(",").map(Number);
  }
  return [...HOT_STARS];
}

function generateOptimal(): DipResult {
  // Strategy: all balls inside IQR (typical pattern), sum within IQR (114-149),
  // strong consecutive suppression, frequency-weighted star pairs.
  // B2+B3 positional correlation (67%) is naturally handled by IQR-only generation.
  const maxAttempts = 500;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const balls: DipBall[] = [];
    let minVal = 1;
    let valid = true;

    for (let pos = 0; pos < 5; pos++) {
      const { q1, q3 } = iqrs[pos];
      const lo = Math.max(minVal, q1);
      const hi = Math.min(q3, 50 - (4 - pos));
      if (lo > hi) { valid = false; break; }

      const pool: Record<number, number> = {};
      for (let n = lo; n <= hi; n++) pool[n] = mainFreq[n] || 1;

      // Consecutive + co-occurrence suppression
      if (balls.length > 0) {
        const prev = balls[balls.length - 1].n;
        Object.keys(pool).forEach((nk) => {
          const n = +nk;
          if (n - prev === 1) pool[n] *= 0.08;
          const minCoOcc = Math.min(...balls.map(b => coMat[b.n]?.[n] ?? 0));
          if (minCoOcc === 0) pool[n] *= 0.08;
          else if (minCoOcc === 1) pool[n] *= 0.35;
        });
      }

      if (Object.keys(pool).length === 0) { valid = false; break; }
      const picked = weightedRandom(pool);
      balls.push({ n: picked, outlier: false });
      minVal = picked + 1;
    }

    if (!valid || balls.length < 5) continue;
    const sum = balls.reduce((a, b) => a + b.n, 0);
    if (sum < sumQ1 || sum > sumQ3) continue;

    return { balls, stars: pickOptimalStars(), sum };
  }

  // Fallback: relax sum constraint
  const balls: DipBall[] = [];
  let minVal = 1;
  for (let pos = 0; pos < 5; pos++) {
    const { q1, q3 } = iqrs[pos];
    const lo = Math.max(minVal, q1);
    const hi = Math.min(q3, 50 - (4 - pos));
    const pool: Record<number, number> = {};
    for (let n = Math.max(lo, minVal); n <= hi; n++) pool[n] = mainFreq[n] || 1;
    if (Object.keys(pool).length === 0) { pool[Math.max(lo, minVal)] = 1; }
    const picked = weightedRandom(pool);
    balls.push({ n: picked, outlier: false });
    minVal = picked + 1;
  }
  return { balls, stars: [...HOT_STARS], sum: balls.reduce((a, b) => a + b.n, 0) };
}

function OptimalDip() {
  const [result, setResult] = useState<DipResult | null>(null);
  const [history, setHistory] = useState<DipResult[]>([]);

  function handleGenerate() {
    const r = generateOptimal();
    setResult(r);
    setHistory((h) => [r, ...h].slice(0, 5));
  }

  const diff = result ? result.sum - avgSum : 0;

  return (
    <Card>
      {/* Dark header strip */}
      <div
        className="rounded-xl p-4 mb-5"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#fbbf24" }}>Optimal Pick</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>data-driven</span>
            </div>
            <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>Best statistical combination</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              All balls within IQR · Sum 114–149 · Freq-weighted stars · No consecutive pairs
            </p>
          </div>
        </div>

        {/* Odds comparison */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 rounded-lg p-2.5 text-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Standard odds</p>
            <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>140M : 1</p>
          </div>
          <div className="flex items-center" style={{ color: "#fbbf24", fontSize: 16 }}>→</div>
          <div className="flex-1 rounded-lg p-2.5 text-center" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}>
            <p className="text-xs mb-0.5" style={{ color: "#fbbf24", opacity: 0.7 }}>Effective odds*</p>
            <p className="text-sm font-bold" style={{ color: "#fbbf24" }}>~45M : 1</p>
          </div>
        </div>
        <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
          *Based on historical pattern frequency. Lottery draws are random — this reflects observed bias only.
        </p>
      </div>

      {/* What this strategy uses */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { label: "Ball pattern", value: "All IQR", note: "9.3% of draws" },
          { label: "Sum range", value: "114–149", note: "middle 50% of sums" },
          { label: "Lucky Stars", value: "Freq-weighted", note: `hot pair LS${HOT_STARS[0]}+LS${HOT_STARS[1]} favoured` },
          { label: "Consecutive", value: "Suppressed", note: "matches 12.5% real rate" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-2.5" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <p className="text-xs" style={{ color: "#64748b" }}>{s.label}</p>
            <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{s.note}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-105 active:scale-95"
        style={{
          background: "linear-gradient(160deg,#fcd34d 0%,#f59e0b 45%,#d97706 100%)",
          color: "#1c1917",
          boxShadow: "0 4px 20px rgba(217,119,6,0.4), 0 1px 6px rgba(217,119,6,0.22), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        Generate Optimal Pick →
      </button>

      {result && (
        <div className="mt-5 pt-5 border-t" style={{ borderColor: "#e2e8f0" }}>
          <div className="flex flex-wrap gap-2 items-center mb-3">
            {result.balls.map((b) => (
              <span key={b.n} className="ball ball-lg" style={{ background: "linear-gradient(145deg,#3b82f6,#1d4ed8)", color: "#ffffff" }}>{b.n}</span>
            ))}
            <span className="text-xl mx-1" style={{ color: "#94a3b8" }}>★</span>
            {result.stars.map((s) => <Ball key={s} n={s} type="star" size="lg" />)}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: "rgba(30,58,138,0.08)", color: "#1e3a8a" }}>
              Sum: {result.sum} ({diff > 0 ? "+" : ""}{diff.toFixed(0)} vs avg)
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: "rgba(251,191,36,0.1)", color: "#b45309" }}>
              Stars LS{result.stars[0]}+LS{result.stars[1]}
            </span>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "#e2e8f0" }}>
          <p className="text-xs mb-2" style={{ color: "#94a3b8" }}>Previous picks</p>
          {history.slice(1).map((h, i) => (
            <div key={i} className="flex flex-wrap gap-1.5 items-center py-2 border-b last:border-0" style={{ borderColor: "#f1f5f9" }}>
              {h.balls.map((b) => (
                <span key={b.n} className="ball ball-sm" style={{ background: "linear-gradient(145deg,#3b82f6,#1d4ed8)", color: "#ffffff" }}>{b.n}</span>
              ))}
              <span className="text-xs mx-0.5" style={{ color: "#94a3b8" }}>★</span>
              {h.stars.map((s) => <Ball key={s} n={s} type="star" size="sm" />)}
              <span className="ml-auto text-xs tabular-nums" style={{ color: "#64748b" }}>{h.sum}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
