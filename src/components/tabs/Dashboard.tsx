import { draws } from "@/lib/data";
import {
  N, mainSorted, starSorted, maxMF, maxSF, avgSum, bandOf, iqrs, siqrs, mainRanks, starRanks
} from "@/lib/stats";
import { formatDate } from "@/lib/utils";
import Card, { CardTitle } from "@/components/ui/Card";
import Ball from "@/components/ui/Ball";

const hot = mainSorted[0];
const cold = mainSorted[mainSorted.length - 1];
const hotS = starSorted[0];

const kpis = [
  { label: "Draws", value: N, sub: "in dataset" },
  { label: "Hottest Ball", value: hot.n, sub: `drawn ${hot.c}×` },
  { label: "Hottest Star", value: hotS.n, sub: `drawn ${hotS.c}×` },
  { label: "Avg Sum", value: Math.round(avgSum), sub: "per draw" },
  { label: "Coldest Ball", value: cold.n, sub: `drawn ${cold.c}×` },
];

const recent = draws.slice(0, 5);
const top10 = mainSorted.slice(0, 10);
const top6stars = starSorted.slice(0, 6);

function parseDate(s: string): Date {
  const [d, m, y] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function Dashboard() {
  return (
    <div className="pt-6">
      {/* Hero */}
      <div
        className="rounded-2xl p-6 mb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)", border: "none" }}
      >
        {/* Subtle ball pattern overlay */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 50%, rgba(251,191,36,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: "#fbbf24", letterSpacing: "0.12em" }}>EuroMillions</p>
        <h1 className="text-3xl font-bold mb-1.5">
          <span className="text-gold-gradient">Stats Dashboard</span>
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{N} draws · Jan 2022 – Jun 2026 · Balls 1–50 · Stars 1–12</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#6a6a6a" }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: "#2563eb" }}>{k.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6a6a6a" }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent draws */}
      <Card>
        <CardTitle badge="last 5">Recent Draws</CardTitle>
        <div className="space-y-3">
          {recent.map((d) => (
            <div key={d[0]} className="flex items-center gap-3 flex-wrap">
              <span className="text-xs w-24 shrink-0" style={{ color: "#9a9a9a" }}>
                {parseDate(d[0]).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
              </span>
              <div className="flex gap-1.5">
                {d[1].map((n) => <Ball key={n} n={n} size="sm" />)}
              </div>
              <span className="text-sm" style={{ color: "#3a3a3a" }}>★</span>
              <div className="flex gap-1.5">
                {d[2].map((s) => <Ball key={s} n={s} type="star" size="sm" />)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top 10 main balls */}
      <Card>
        <CardTitle badge="by frequency">Top 10 Main Balls</CardTitle>
        <div className="space-y-2">
          {top10.map((x, i) => (
            <div key={x.n} className="flex items-center gap-3">
              <span className="text-xs w-4 shrink-0" style={{ color: "#3a3a3a" }}>{i + 1}</span>
              <Ball n={x.n} size="sm" />
              <div className="flex-1 h-2 rounded-full" style={{ background: "#e5e5e5" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(x.c / maxMF) * 100}%`,
                    background: "linear-gradient(90deg,#3b82f6,#2563eb)",
                  }}
                />
              </div>
              <span className="text-xs w-8 text-right tabular-nums" style={{ color: "#6a6a6a" }}>{x.c}×</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-md shrink-0"
                style={{ background: "rgba(37,99,235,0.08)", color: "#2563eb" }}
              >
                {bandOf(x.n)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top 6 lucky stars */}
      <Card>
        <CardTitle badgeBlue="by frequency">Top 6 Lucky Stars</CardTitle>
        <div className="space-y-2">
          {top6stars.map((x, i) => (
            <div key={x.n} className="flex items-center gap-3">
              <span className="text-xs w-4 shrink-0" style={{ color: "#3a3a3a" }}>{i + 1}</span>
              <Ball n={x.n} type="star" size="sm" />
              <div className="flex-1 h-2 rounded-full" style={{ background: "#e5e5e5" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(x.c / maxSF) * 100}%`,
                    background: "linear-gradient(90deg,#fbbf24,#d97706)",
                  }}
                />
              </div>
              <span className="text-xs w-8 text-right tabular-nums" style={{ color: "#6a6a6a" }}>{x.c}×</span>
              <span className="text-xs tabular-nums" style={{ color: "#6a6a6a" }}>{(x.c / N * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
