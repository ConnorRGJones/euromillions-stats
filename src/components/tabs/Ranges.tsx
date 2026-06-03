import { iqrs, siqrs, pv, sv, mean, boxData } from "@/lib/stats";
import Card, { CardTitle } from "@/components/ui/Card";

function BoxPlot({ label, iqrLabel, vals, maxVal, isStars }: {
  label: string; iqrLabel: string; vals: number[]; maxVal: number; isStars: boolean;
}) {
  const bd = boxData(vals);
  const pct = (v: number) => `${((v - 1) / (maxVal - 1)) * 100}%`;
  const iqrColor = isStars ? "#d97706" : "#3b82f6";

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium" style={{ color: "#0a0a0a" }}>{label}</span>
        <span style={{ color: "#6a6a6a" }}>IQR {iqrLabel}</span>
      </div>
      <div className="relative h-7 rounded-md" style={{ background: "#e5e5e5" }}>
        <div
          className="absolute top-1.5 bottom-1.5 rounded opacity-80"
          style={{ left: pct(bd.q1), width: `calc(${pct(bd.q3)} - ${pct(bd.q1)})`, background: iqrColor }}
        />
        <div
          className="absolute top-1 bottom-1 w-0.5 rounded"
          style={{ left: pct(bd.med), background: "#0a1a1a" }}
        />
        {bd.outliers.map((v) => (
          <div
            key={v}
            className="absolute top-1/2 w-2 h-2 rounded-full -translate-y-1/2 -translate-x-1/2 opacity-60"
            style={{ left: pct(v), background: "#9a9a9a" }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs mt-1 px-0.5" style={{ color: "#9a9a9a" }}>
        <span>{bd.min}</span>
        <span style={{ color: "#6a6a6a" }}>med {Math.round(bd.med)}</span>
        <span>{bd.max}</span>
      </div>
    </div>
  );
}

export default function Ranges() {
  return (
    <div className="pt-6">
      <Card>
        <CardTitle>Position Box Plots</CardTitle>
        <p className="text-xs leading-relaxed mb-5" style={{ color: "#9a9a9a" }}>
          Box = middle 50% (IQR) · Line = median · Dots = statistical outliers beyond 1.5×IQR
        </p>

        <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "#6a6a6a" }}>Main Balls</p>
        {[0, 1, 2, 3, 4].map((i) => (
          <BoxPlot
            key={i}
            label={`Ball ${i + 1}`}
            iqrLabel={`${iqrs[i].q1}–${iqrs[i].q3}`}
            vals={pv(i)}
            maxVal={50}
            isStars={false}
          />
        ))}

        <div className="border-t my-4" style={{ borderColor: "#e5e5e5" }} />

        <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "#6a6a6a" }}>Lucky Stars</p>
        {[0, 1].map((i) => (
          <BoxPlot
            key={i}
            label={`Star ${i + 1}`}
            iqrLabel={`${siqrs[i].q1}–${siqrs[i].q3}`}
            vals={sv(i)}
            maxVal={12}
            isStars={true}
          />
        ))}

        <div className="flex gap-5 flex-wrap mt-2">
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6a6a6a" }}>
            <span className="w-5 h-2.5 rounded opacity-80 inline-block" style={{ background: "#3b82f6" }} />
            IQR main (50%)
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6a6a6a" }}>
            <span className="w-5 h-2.5 rounded opacity-80 inline-block" style={{ background: "#d97706" }} />
            IQR stars (50%)
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6a6a6a" }}>
            <span className="w-0.5 h-4 rounded inline-block" style={{ background: "#0a1a1a", border: "1px solid #9a9a9a" }} />
            Median
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6a6a6a" }}>
            <span className="w-2 h-2 rounded-full inline-block opacity-60" style={{ background: "#9a9a9a" }} />
            Outlier
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Position Summary</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#f3f3f4" }}>
                {["Position", "Min", "Median", "Max", "Q1", "Q3", "Avg"].map((h) => (
                  <th key={h} className="text-left px-2 py-2 font-medium" style={{ color: "#6a6a6a" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-b" style={{ borderColor: "#e5e5e5" }}>
                  <td className="px-2 py-2 font-semibold" style={{ color: "#0a0a0a" }}>Ball {i + 1}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#6a6a6a" }}>{iqrs[i].min}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#6a6a6a" }}>{Math.round(iqrs[i].med)}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#6a6a6a" }}>{iqrs[i].max}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#2563eb" }}>{iqrs[i].q1}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#2563eb" }}>{iqrs[i].q3}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#6a6a6a" }}>{mean(pv(i)).toFixed(1)}</td>
                </tr>
              ))}
              {[0, 1].map((i) => (
                <tr key={`s${i}`} className="border-b" style={{ borderColor: "#e5e5e5", background: "rgba(217,119,6,0.04)" }}>
                  <td className="px-2 py-2 font-semibold" style={{ color: "#0a0a0a" }}>Star {i + 1}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#6a6a6a" }}>{siqrs[i].min}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#6a6a6a" }}>{Math.round(siqrs[i].med)}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#6a6a6a" }}>{siqrs[i].max}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#d97706" }}>{siqrs[i].q1}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#d97706" }}>{siqrs[i].q3}</td>
                  <td className="px-2 py-2 tabular-nums" style={{ color: "#6a6a6a" }}>{mean(sv(i)).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
