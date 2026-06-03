import {
  N, outlierDist, outlierPcts, posOutlierCount,
  posOutlierBelow, posOutlierAbove,
  posHistoricalMin, posHistoricalMax,
  condOutlierMatrix, baseOutlierRates,
  consecDraws, consecByOutlierCount,
  starPairs, oddDist, lowDist, sumQ1, sumQ3, avgSum,
  iqrs,
} from "@/lib/stats";
import Card, { CardTitle } from "@/components/ui/Card";

const maxPct = Math.max(...outlierPcts);

// Colour scale for correlation cells: low = near-transparent, high = blue scale
function cellColor(val: number): string {
  if (val < 0) return "rgba(0,0,0,0.03)";
  const t = Math.max(0, (val - 0.40) / 0.30); // 0 at 40%, 1 at 70%+
  if (t < 0.01) return "rgba(0,0,0,0.03)";
  const alpha = 0.12 + t * 0.10; // 0.12 → 0.22
  return `rgba(37,99,235,${alpha.toFixed(3)})`;
}
function cellTextColor(val: number): string {
  if (val < 0) return "#9a9a9a";
  const t = Math.max(0, (val - 0.40) / 0.30);
  if (t > 0.6) return "#2563eb";
  if (t > 0.2) return "#3a3a3a";
  return "#9a9a9a";
}

export default function Outliers() {
  return (
    <div className="pt-6">

      {/* Outlier count distribution */}
      <Card>
        <CardTitle>How Often Are All Balls "Normal"?</CardTitle>
        <p className="text-xs leading-relaxed mb-5" style={{ color: "#3a3a3a" }}>
          A ball is an "outlier" when it falls outside the IQR for its draw position.
          ~45% per position is expected — the IQR covers the middle 50% by definition.
          The interesting signal is how they <em>cluster</em>.
        </p>

        <div className="space-y-3 mb-6">
          {outlierDist.map((c, k) => {
            const barColor = k === 0 ? "#3b82f6" : k <= 2 ? "#d97706" : "#dc2626";
            const pct = outlierPcts[k];
            return (
              <div key={k} className="flex items-center gap-3">
                <span className="text-xs font-medium w-20 shrink-0" style={{ color: "#6a6a6a" }}>
                  {k === 0 ? "None" : k === 1 ? "1 outlier" : `${k} outliers`}
                </span>
                <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: "#e5e5e5" }}>
                  <div
                    className="h-full rounded-md flex items-center pl-2"
                    style={{ width: `${(pct / maxPct) * 100}%`, background: barColor, minWidth: 32 }}
                  >
                    <span className="text-xs font-semibold" style={{ color: "#ffffff" }}>{pct}%</span>
                  </div>
                </div>
                <span className="text-xs w-16 text-right shrink-0" style={{ color: "#9a9a9a" }}>{c} draws</span>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ color: "#3a3a3a", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)" }}>
          If outliers were independent, "all normal" would occur ~4.7% of the time and "all outlier" ~2.0%.
          Instead we see <strong style={{ color: "#0a0a0a" }}>9.3%</strong> and <strong style={{ color: "#0a0a0a" }}>5.4%</strong> respectively —
          draws tend to be either all-normal or all-weird as a unit.
        </div>
      </Card>

      {/* Position outlier rates */}
      <Card>
        <CardTitle>Outlier Rate by Position</CardTitle>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "#3a3a3a" }}>
          Each ball&apos;s ~45% outlier rate splits roughly evenly between <span style={{ color: "#2563eb" }}>▼ below Q1</span> and <span style={{ color: "#dc2626" }}>▲ above Q3</span>.
          The historical range shows the furthest a ball has ever strayed.
        </p>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {posOutlierCount.map((c, i) => (
            <div
              key={i}
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.12)" }}
            >
              <p className="text-xs mb-1" style={{ color: "#9a9a9a" }}>Ball {i + 1}</p>
              <p className="text-sm font-bold mb-1" style={{ color: "#2563eb" }}>
                {Math.round(baseOutlierRates[i] * 100)}%
              </p>
              <p className="text-xs mb-0.5" style={{ color: "#2563eb" }}>
                ▼ {Math.round(posOutlierBelow[i] / N * 100)}%
              </p>
              <p className="text-xs mb-1.5" style={{ color: "#dc2626" }}>
                ▲ {Math.round(posOutlierAbove[i] / N * 100)}%
              </p>
              <p className="text-xs leading-tight" style={{ color: "#9a9a9a" }}>
                IQR {iqrs[i].q1}–{iqrs[i].q3}
              </p>
              <p className="text-xs leading-tight" style={{ color: "#9a9a9a" }}>
                seen {posHistoricalMin[i]}–{posHistoricalMax[i]}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "#9a9a9a" }}>
          The real structure lies in how positions correlate — see below. Note Ball 1 has never appeared above 29,
          and Ball 5 has never appeared below 18 — the generator respects these historical bounds.
        </p>
      </Card>

      {/* Correlation matrix */}
      <Card>
        <CardTitle badge="key finding">Position Correlation Matrix</CardTitle>
        <p className="text-xs leading-relaxed mb-5" style={{ color: "#3a3a3a" }}>
          If a given ball position is an outlier, how likely is each other position to also be one?
          Brighter cells = stronger correlation. The B2↔B3 pair at <strong style={{ color: "#0a0a0a" }}>66–67%</strong> is
          the strongest signal in the dataset.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: "separate", borderSpacing: 3 }}>
            <thead>
              <tr>
                <th className="font-normal pb-1 pr-2 text-right" style={{ width: 60, color: "#9a9a9a" }}>Given ↓</th>
                {[1,2,3,4,5].map(j => (
                  <th key={j} className="font-semibold pb-1 text-center" style={{ width: 52, color: "#6a6a6a" }}>B{j}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {condOutlierMatrix.map((row, i) => (
                <tr key={i}>
                  <td className="font-semibold pr-2 text-right py-0.5" style={{ color: "#6a6a6a" }}>B{i+1}</td>
                  {row.map((val, j) => (
                    <td key={j} className="text-center py-0.5">
                      <div
                        className="rounded-lg py-1.5 font-medium tabular-nums"
                        style={{
                          background: cellColor(val),
                          color: cellTextColor(val),
                          minWidth: 44,
                        }}
                      >
                        {val < 0 ? "—" : `${Math.round(val * 100)}%`}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.15)" }}>
            <strong style={{ color: "#0a0a0a" }}>B2 ↔ B3 (66–67%)</strong>
            <p className="mt-1" style={{ color: "#3a3a3a" }}>The strongest correlation. If Ball 2 is an outlier, Ball 3 is also an outlier in <strong style={{ color: "#0a0a0a" }}>2 out of 3 draws</strong>.</p>
          </div>
          <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)" }}>
            <strong style={{ color: "#0a0a0a" }}>B5 is most independent</strong>
            <p className="mt-1" style={{ color: "#3a3a3a" }}>Ball 5 shows the weakest conditional rates (~45–52%), close to its 44% base rate — it barely responds to what the other balls do.</p>
          </div>
        </div>
      </Card>

      {/* Consecutive pairs vs outlier count */}
      <Card>
        <CardTitle>Consecutive Numbers × Outlier Count</CardTitle>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "#3a3a3a" }}>
          How often does a draw contain at least one consecutive pair (e.g. 31, 32)?
          Overall rate: <strong style={{ color: "#0a0a0a" }}>{(consecDraws / N * 100).toFixed(1)}%</strong> of draws.
          But this varies sharply by how many outliers are present.
        </p>

        <div className="space-y-2 mb-4">
          {consecByOutlierCount.map((rate, k) => {
            const pct = Math.round(rate * 100);
            const barColor = k === 0 ? "#3b82f6" : k === 1 ? "#6a6a6a" : "#d97706";
            return (
              <div key={k} className="flex items-center gap-3">
                <span className="text-xs w-20 shrink-0" style={{ color: "#6a6a6a" }}>
                  {k === 0 ? "0 outliers" : k === 1 ? "1 outlier" : `${k} outliers`}
                </span>
                <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: "#e5e5e5" }}>
                  <div
                    className="h-full rounded"
                    style={{ width: `${pct}%`, background: barColor, minWidth: 24 }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums w-8 text-right" style={{ color: barColor }}>{pct}%</span>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ color: "#3a3a3a", background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.15)" }}>
          Draws with <strong style={{ color: "#0a0a0a" }}>0 outliers</strong> contain consecutives only <strong style={{ color: "#0a0a0a" }}>12.5%</strong> of the time.
          Draws with <strong style={{ color: "#0a0a0a" }}>2 outliers</strong> shoot up to <strong style={{ color: "#0a0a0a" }}>42.2%</strong> — a <strong style={{ color: "#0a0a0a" }}>3.4× increase</strong>.
          Outlier-heavy draws are far more likely to contain consecutive numbers.
        </div>
      </Card>

      {/* Balance distributions */}
      <Card>
        <CardTitle>Draw Balance Patterns</CardTitle>
        <p className="text-xs leading-relaxed mb-5" style={{ color: "#3a3a3a" }}>
          How do draws typically split between odd/even and high/low numbers?
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Odd/even */}
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: "#0a0a0a" }}>Odd balls per draw</p>
            <div className="space-y-2">
              {oddDist.map((frac, k) => {
                const pct = Math.round(frac * 100);
                const isCommon = k === 2 || k === 3;
                return (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-xs w-4 shrink-0" style={{ color: "#6a6a6a" }}>{k}</span>
                    <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: "#e5e5e5" }}>
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${pct * 3}%`,
                          background: isCommon ? "#3b82f6" : "rgba(106,106,106,0.4)",
                        }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right tabular-nums" style={{ color: "#6a6a6a" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-2" style={{ color: "#9a9a9a" }}>2–3 odd balls occurs in <strong style={{ color: "#6a6a6a" }}>67%</strong> of draws</p>
          </div>

          {/* Low/high */}
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: "#0a0a0a" }}>Low balls (1–25) per draw</p>
            <div className="space-y-2">
              {lowDist.map((frac, k) => {
                const pct = Math.round(frac * 100);
                const isCommon = k === 2 || k === 3;
                return (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-xs w-4 shrink-0" style={{ color: "#6a6a6a" }}>{k}</span>
                    <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: "#e5e5e5" }}>
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${pct * 3}%`,
                          background: isCommon ? "#059669" : "rgba(106,106,106,0.4)",
                        }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right tabular-nums" style={{ color: "#6a6a6a" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-2" style={{ color: "#9a9a9a" }}>Draws lean slightly high — <strong style={{ color: "#6a6a6a" }}>3 low balls</strong> is most common (37%)</p>
          </div>
        </div>
      </Card>

      {/* Sum range */}
      <Card>
        <CardTitle>Draw Sum Distribution</CardTitle>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "#3a3a3a" }}>
          The sum of all 5 main balls across {N} draws. Most draws cluster between{" "}
          <strong style={{ color: "#0a0a0a" }}>{sumQ1}–{sumQ3}</strong>.
        </p>
        <div className="flex items-end gap-1 h-16 mb-3">
          {[2, 12, 18, 22, 22, 14, 7, 3].map((pct, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t"
                style={{ height: `${pct * 2.8}px`, background: "linear-gradient(180deg,#3b82f6,#2563eb)" }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs mb-4" style={{ color: "#9a9a9a" }}>
          <span>&lt; 80</span>
          <span>190+</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Average sum", value: Math.round(avgSum).toString() },
            { label: "IQR", value: `${sumQ1}–${sumQ3}` },
            { label: "Sweet spot", value: "100–150" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)" }}>
              <p className="text-xs mb-0.5" style={{ color: "#9a9a9a" }}>{label}</p>
              <p className="text-sm font-bold" style={{ color: "#2563eb" }}>{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Star pairs */}
      <Card>
        <CardTitle badgeBlue="top pairs">Star Pair Frequency</CardTitle>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "#3a3a3a" }}>
          Most common lucky star combinations from {N} draws.
        </p>
        <div className="space-y-2">
          {starPairs.slice(0, 12).map((p) => {
            const pct = p.c / starPairs[0].c;
            return (
              <div key={p.pair.join(",")} className="flex items-center gap-3">
                <span className="text-xs w-16 shrink-0" style={{ color: "#6a6a6a" }}>
                  LS{p.pair[0]}+LS{p.pair[1]}
                </span>
                <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: "#e5e5e5" }}>
                  <div
                    className="h-full rounded"
                    style={{ width: `${pct * 100}%`, background: "linear-gradient(90deg,#fbbf24,#d97706)" }}
                  />
                </div>
                <span className="text-xs w-6 text-right tabular-nums" style={{ color: "#6a6a6a" }}>{p.c}×</span>
                <span className="text-xs w-10 text-right tabular-nums" style={{ color: "#9a9a9a" }}>
                  {(p.c / N * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
