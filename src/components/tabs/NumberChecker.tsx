"use client";

import { useState } from "react";
import {
  N, iqrs, siqrs, mainFreq, starFreq, mainRanks, starRanks, avgSum,
  coMat, bandOf, sumQ1, sumQ3, oddDist, lowDist,
} from "@/lib/stats";
import Card, { CardTitle } from "@/components/ui/Card";
import Ball from "@/components/ui/Ball";

// ── types ─────────────────────────────────────────────────────────────────────

interface BallResult {
  n: number; pos: number; isStar: boolean;
  freq: number; rank: number; total: number;
  inIQR: boolean; q1: number; q3: number; min: number; max: number;
  companions: { n: number; count: number }[];
}

interface CoFlag {
  a: number; b: number; count: number; severity: "red" | "amber";
}

interface CombinationInsights {
  coFlags: CoFlag[];
  sum: number | null;
  sumInIQR: boolean | null;
  oddCount: number;
  evenCount: number;
  oddPct: number;
  lowCount: number;
  highCount: number;
  lowPct: number;
  consecPairs: [number, number][];
  score: number; // negative = flags (0 = clean, -1 = one concern, etc.)
  verdict: string;
  verdictLevel: "green" | "blue" | "amber" | "red";
}

// ── helpers ───────────────────────────────────────────────────────────────────

function pct(v: number) {
  return (v * 100).toFixed(1) + "%";
}

function buildInsights(balls: number[]): CombinationInsights {
  // 1. Co-occurrence flags
  const coFlags: CoFlag[] = [];
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j];
      const count = coMat[a]?.[b] ?? 0;
      if (count === 0) coFlags.push({ a, b, count, severity: "red" });
      else if (count === 1) coFlags.push({ a, b, count, severity: "amber" });
    }
  }

  // 2. Sum
  const sum = balls.length === 5 ? balls.reduce((a, b) => a + b, 0) : null;
  const sumInIQR = sum !== null ? sum >= sumQ1 && sum <= sumQ3 : null;

  // 3. Odd / even
  const oddCount = balls.filter((n) => n % 2 !== 0).length;
  const evenCount = balls.length - oddCount;
  const oddPct = oddDist[oddCount] ?? 0;

  // 4. Low / high
  const lowCount = balls.filter((n) => n <= 25).length;
  const highCount = balls.length - lowCount;
  const lowPct = lowDist[lowCount] ?? 0;

  // 5. Consecutive pairs
  const sorted = [...balls].sort((a, b) => a - b);
  const consecPairs: [number, number][] = [];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) consecPairs.push([sorted[i - 1], sorted[i]]);
  }

  // 6. Score
  let score = 0;
  for (const f of coFlags) score += f.severity === "red" ? -1 : -0.5;
  if (sum !== null && !sumInIQR) score -= 1;
  if (balls.length === 5 && oddPct < 0.05) score -= 1;
  if (balls.length === 5 && lowPct < 0.05) score -= 1;

  let verdict: string;
  let verdictLevel: "green" | "blue" | "amber" | "red";
  if (score === 0) {
    verdict = "Strong combination — matches typical draw patterns well";
    verdictLevel = "green";
  } else if (score >= -1) {
    verdict = "Decent — one statistical concern";
    verdictLevel = "blue";
  } else if (score >= -2) {
    verdict = "Weak — multiple patterns suggest this combo is unlikely";
    verdictLevel = "amber";
  } else {
    verdict = "Very unlikely — this combination has multiple historically rare features";
    verdictLevel = "red";
  }

  return {
    coFlags, sum, sumInIQR,
    oddCount, evenCount, oddPct,
    lowCount, highCount, lowPct,
    consecPairs, score, verdict, verdictLevel,
  };
}

// ── style helpers ─────────────────────────────────────────────────────────────

const chipStyles = {
  red:   { background: "rgba(220,38,38,0.08)",   color: "#dc2626" },
  amber: { background: "rgba(217,119,6,0.08)",   color: "#d97706" },
  green: { background: "rgba(5,150,105,0.08)",   color: "#059669" },
  blue:  { background: "rgba(30,58,138,0.08)",   color: "#1e3a8a" },
  grey:  { background: "#f1f5f9",                color: "#64748b" },
};

function Chip({ variant, children }: { variant: keyof typeof chipStyles; children: React.ReactNode }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={chipStyles[variant]}>
      {children}
    </span>
  );
}

function InsightRow({ icon, text, variant }: { icon: string; text: string; variant: keyof typeof chipStyles }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="text-sm leading-5">{icon}</span>
      <span className="text-sm leading-5" style={{ color: chipStyles[variant].color }}>{text}</span>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function NumberChecker() {
  const [inputs, setInputs] = useState({ b1: "", b2: "", b3: "", b4: "", b5: "", s1: "", s2: "" });
  const [results, setResults] = useState<BallResult[] | null>(null);
  const [insights, setInsights] = useState<CombinationInsights | null>(null);

  function runChecker() {
    const ballNums = [inputs.b1, inputs.b2, inputs.b3, inputs.b4, inputs.b5]
      .map((v) => (v === "" ? null : +v))
      .filter((v): v is number => v !== null && v >= 1 && v <= 50);
    const starNums = [inputs.s1, inputs.s2]
      .map((v) => (v === "" ? null : +v))
      .filter((v): v is number => v !== null && v >= 1 && v <= 12);

    const res: BallResult[] = [];
    ballNums.forEach((n, pi) => {
      const companions = Object.entries(coMat[n] || {})
        .filter(([k]) => ballNums.includes(+k) && +k !== n)
        .sort((a, b) => +b[1] - +a[1])
        .slice(0, 3)
        .map(([k, count]) => ({ n: +k, count: +count }));
      res.push({
        n, pos: pi + 1, isStar: false,
        freq: mainFreq[n] || 0, rank: mainRanks[n] || 0, total: 50,
        inIQR: n >= iqrs[pi].q1 && n <= iqrs[pi].q3,
        q1: iqrs[pi].q1, q3: iqrs[pi].q3, min: iqrs[pi].min, max: iqrs[pi].max,
        companions,
      });
    });
    starNums.forEach((s, si) => {
      res.push({
        n: s, pos: si + 1, isStar: true,
        freq: starFreq[s] || 0, rank: starRanks[s] || 0, total: 12,
        inIQR: s >= siqrs[si].q1 && s <= siqrs[si].q3,
        q1: siqrs[si].q1, q3: siqrs[si].q3, min: siqrs[si].min, max: siqrs[si].max,
        companions: [],
      });
    });

    setResults(res);
    setInsights(ballNums.length >= 2 ? buildInsights(ballNums) : null);
  }

  return (
    <div className="pt-6">
      <Card>
        <CardTitle>Number Checker</CardTitle>
        <p className="text-xs mb-5 leading-relaxed" style={{ color: "#64748b" }}>
          Enter up to 5 main balls (1–50) and 2 lucky stars (1–12) for a full statistical breakdown of your combination.
        </p>

        {/* ── Inputs ── */}
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Main Balls</p>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {(["b1", "b2", "b3", "b4", "b5"] as const).map((k, i) => (
            <div key={k} className="flex flex-col items-center gap-1">
              <span className="text-xs" style={{ color: "#64748b" }}>Ball {i + 1}</span>
              <input
                type="number" min={1} max={50} placeholder="—"
                value={inputs[k]}
                onChange={(e) => setInputs({ ...inputs, [k]: e.target.value })}
                className="w-full aspect-square text-center font-bold text-base rounded-xl outline-none tabular-nums"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#0f172a",
                  MozAppearance: "textfield",
                }}
              />
            </div>
          ))}
        </div>

        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Lucky Stars</p>
        <div className="grid grid-cols-2 gap-2 mb-5 max-w-[160px]">
          {(["s1", "s2"] as const).map((k, i) => (
            <div key={k} className="flex flex-col items-center gap-1">
              <span className="text-xs" style={{ color: "#64748b" }}>Star {i + 1}</span>
              <input
                type="number" min={1} max={12} placeholder="—"
                value={inputs[k]}
                onChange={(e) => setInputs({ ...inputs, [k]: e.target.value })}
                className="w-full aspect-square text-center font-bold text-base rounded-xl outline-none tabular-nums"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#0f172a",
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={runChecker}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95 mb-5"
          style={{
            background: "linear-gradient(160deg,#fcd34d,#f59e0b 45%,#d97706)",
            border: "none",
            color: "#1c1917",
          }}
        >
          Analyse →
        </button>

        {results === null && (
          <p className="text-center text-sm py-4" style={{ color: "#64748b" }}>Enter numbers above and tap Analyse.</p>
        )}

        {results && results.length === 0 && (
          <p className="text-center text-sm py-4" style={{ color: "#64748b" }}>No valid numbers entered.</p>
        )}

        {results && results.length > 0 && (
          <div className="space-y-3">

            {/* ── Combination-level analysis card ── */}
            {insights && (
              <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>

                {/* Verdict */}
                <div
                  className="rounded-lg px-3 py-2 mb-4 flex items-center gap-2"
                  style={chipStyles[insights.verdictLevel]}
                >
                  <span className="text-base">
                    {insights.verdictLevel === "green" ? "✓" : insights.verdictLevel === "blue" ? "ℹ" : insights.verdictLevel === "amber" ? "⚠" : "✕"}
                  </span>
                  <span className="text-sm font-semibold">{insights.verdict}</span>
                </div>

                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>
                  Combination Analysis
                </p>

                <div className="divide-y" style={{ borderColor: "#e2e8f0" }}>

                  {/* Co-occurrence flags */}
                  {insights.coFlags.length > 0 && insights.coFlags.map((f) => (
                    <InsightRow
                      key={`${f.a}-${f.b}`}
                      icon={f.severity === "red" ? "⛔" : "⚠️"}
                      variant={f.severity}
                      text={
                        f.count === 0
                          ? `${f.a} and ${f.b} have never appeared in the same draw (${N} draws)`
                          : `${f.a} and ${f.b} have only appeared together once`
                      }
                    />
                  ))}
                  {insights.coFlags.length === 0 && (
                    <InsightRow icon="✓" variant="green" text="All pairs have appeared together before — no historically impossible combinations" />
                  )}

                  {/* Sum check */}
                  {insights.sum !== null && (
                    <InsightRow
                      icon={insights.sumInIQR ? "✓" : "⚠️"}
                      variant={insights.sumInIQR ? "green" : "red"}
                      text={
                        insights.sumInIQR
                          ? `Sum ${insights.sum} is in the typical range (${sumQ1}–${sumQ3}) — middle 50% of all draws`
                          : `Sum ${insights.sum} is outside the typical range (${sumQ1}–${sumQ3}) — this spread is historically uncommon`
                      }
                    />
                  )}

                  {/* Odd / even */}
                  <InsightRow
                    icon="◑"
                    variant={insights.oddPct >= 0.10 ? "green" : "amber"}
                    text={`${insights.oddCount} odd / ${insights.evenCount} even — this balance appears in ${pct(insights.oddPct)} of draws`}
                  />

                  {/* Low / high */}
                  <InsightRow
                    icon="↕"
                    variant={insights.lowPct >= 0.10 ? "green" : "amber"}
                    text={`${insights.lowCount} low (1–25) / ${insights.highCount} high (26–50) — appears in ${pct(insights.lowPct)} of draws`}
                  />

                  {/* Consecutive pairs */}
                  {insights.consecPairs.length > 0 ? (
                    <InsightRow
                      icon="⚠️"
                      variant="amber"
                      text={`${insights.consecPairs.length} consecutive pair${insights.consecPairs.length > 1 ? "s" : ""} (${insights.consecPairs.map(([a, b]) => `${a}–${b}`).join(", ")}) — only ~12.5% of typical draws have any`}
                    />
                  ) : (
                    <InsightRow icon="✓" variant="green" text="No consecutive pairs — consistent with the majority of historical draws" />
                  )}

                </div>
              </div>
            )}

            {/* ── Per-ball cards ── */}
            {results.map((r) => {
              const rangeMax = r.isStar ? 12 : 50;
              const posLeft = ((r.n - 1) / (rangeMax - 1)) * 100;
              const iqrLeft = ((r.q1 - 1) / (rangeMax - 1)) * 100;
              const iqrWidth = ((r.q3 - r.q1) / (rangeMax - 1)) * 100;
              return (
                <div key={`${r.isStar ? "s" : "b"}${r.pos}`} className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Ball n={r.n} type={r.isStar ? "star" : "main"} size="md" />
                    <div className="flex-1">
                      <p className="text-xs" style={{ color: "#64748b" }}>
                        {r.isStar ? `Lucky Star ${r.pos}` : `Ball ${r.pos} · ${bandOf(r.n)}`}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                        Drawn <strong>{r.freq}×</strong> · Rank #{r.rank}/{r.total}
                      </p>
                    </div>
                  </div>

                  {!r.isStar && (
                    <>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#64748b" }}>
                        <span>Pos {r.pos} range: {r.min}–{r.max}</span>
                        <span>IQR {r.q1}–{r.q3}</span>
                      </div>
                      <div className="relative h-2 rounded-full mb-2" style={{ background: "#e2e8f0" }}>
                        <div
                          className="absolute top-0 h-full rounded-full opacity-40"
                          style={{ left: `${iqrLeft}%`, width: `${iqrWidth}%`, background: "#d97706" }}
                        />
                        <div
                          className="absolute w-0.5 h-[140%] rounded"
                          style={{
                            left: `${posLeft}%`,
                            top: "50%",
                            transform: "translateX(-50%) translateY(-50%)",
                            background: "#0f172a",
                          }}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Chip variant={r.inIQR ? "green" : "red"}>
                      {r.inIQR ? "✓ In IQR" : "⚠ Outside IQR"}
                    </Chip>
                    <Chip variant="grey">
                      {(r.freq / N * 100).toFixed(1)}% of draws
                    </Chip>
                    <Chip variant="amber">
                      Rank #{r.rank}
                    </Chip>
                  </div>

                  {r.companions.length > 0 && (
                    <div className="mt-2.5">
                      <p className="text-xs mb-1.5" style={{ color: "#64748b" }}>Co-occurs with your picks:</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {r.companions.map((c) => (
                          <span key={c.n} className="text-xs px-2 py-0.5 rounded-md" style={{ background: "#f1f5f9", color: "#64748b" }}>
                            {c.n} · {c.count}×
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
