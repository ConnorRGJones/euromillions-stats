import { N, mainSorted, starSorted, maxMF, maxSF, bandOf } from "@/lib/stats";
import Card, { CardTitle } from "@/components/ui/Card";
import Ball from "@/components/ui/Ball";

export default function FrequencyTables() {
  return (
    <div className="pt-6">
      <Card>
        <CardTitle badge="1–50 ranked">All Main Balls</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f3f3f4" }}>
                {["#", "Ball", "Drawn", "%", "Band", "Bar"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-medium first:pl-1 last:min-w-[80px]" style={{ color: "#6a6a6a" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mainSorted.map((x, i) => (
                <tr key={x.n} className="border-b" style={{ borderColor: "#e5e5e5" }}>
                  <td className="px-3 py-2 text-xs first:pl-1 tabular-nums" style={{ color: "#6a6a6a" }}>{i + 1}</td>
                  <td className="px-3 py-2"><Ball n={x.n} size="sm" /></td>
                  <td className="px-3 py-2 text-sm tabular-nums" style={{ color: "#3a3a3a" }}>{x.c}</td>
                  <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "#6a6a6a" }}>{(x.c / N * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(37,99,235,0.08)", color: "#2563eb" }}>
                      {bandOf(x.n)}
                    </span>
                  </td>
                  <td className="px-3 py-2 last:pr-1">
                    <div className="h-1.5 rounded-full w-full min-w-[60px]" style={{ background: "#e5e5e5" }}>
                      <div className="h-full rounded-full" style={{ width: `${(x.c / maxMF) * 100}%`, background: "linear-gradient(90deg,#3b82f6,#2563eb)" }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle badgeBlue="1–12 ranked">All Lucky Stars</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f3f3f4" }}>
                {["#", "Star", "Drawn", "%", "Bar"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-medium first:pl-1 last:min-w-[80px]" style={{ color: "#6a6a6a" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {starSorted.map((x, i) => (
                <tr key={x.n} className="border-b" style={{ borderColor: "#e5e5e5" }}>
                  <td className="px-3 py-2 text-xs first:pl-1 tabular-nums" style={{ color: "#6a6a6a" }}>{i + 1}</td>
                  <td className="px-3 py-2"><Ball n={x.n} type="star" size="sm" /></td>
                  <td className="px-3 py-2 text-sm tabular-nums" style={{ color: "#3a3a3a" }}>{x.c}</td>
                  <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "#6a6a6a" }}>{(x.c / N * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2 last:pr-1">
                    <div className="h-1.5 rounded-full w-full min-w-[60px]" style={{ background: "#e5e5e5" }}>
                      <div className="h-full rounded-full" style={{ width: `${(x.c / maxSF) * 100}%`, background: "linear-gradient(90deg,#fbbf24,#d97706)" }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
