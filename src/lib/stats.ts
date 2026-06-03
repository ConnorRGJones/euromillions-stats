import { draws } from "./data";

const N = draws.length;

// ── helpers ──────────────────────────────────────────────────────────────────
const srt = (a: number[]) => [...a].sort((x, y) => x - y);
const q1 = (a: number[]) => { const s = srt(a); return s[Math.floor(s.length * 0.25)]; };
const q3 = (a: number[]) => { const s = srt(a); return s[Math.floor(s.length * 0.75)]; };
const median = (a: number[]) => {
  const s = srt(a), n = s.length;
  return n % 2 ? s[Math.floor(n / 2)] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
export const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
export const bandOf = (n: number) =>
  n <= 10 ? "1–10" : n <= 20 ? "11–20" : n <= 30 ? "21–30" : n <= 40 ? "31–40" : "41–50";

// ── positional value arrays ───────────────────────────────────────────────────
export const pv = (i: number) => draws.map((d) => d[1][i]);
export const sv = (i: number) => draws.map((d) => d[2][i]);

// ── IQR ranges per position ───────────────────────────────────────────────────
export interface PositionStats {
  q1: number; q3: number; min: number; max: number; med: number; avg: number;
}
export const iqrs: PositionStats[] = Array.from({ length: 5 }, (_, i) => ({
  q1: q1(pv(i)), q3: q3(pv(i)),
  min: Math.min(...pv(i)), max: Math.max(...pv(i)),
  med: median(pv(i)), avg: mean(pv(i)),
}));
export const siqrs: PositionStats[] = Array.from({ length: 2 }, (_, i) => ({
  q1: q1(sv(i)), q3: q3(sv(i)),
  min: Math.min(...sv(i)), max: Math.max(...sv(i)),
  med: median(sv(i)), avg: mean(sv(i)),
}));

// ── frequency maps ────────────────────────────────────────────────────────────
const allMain = draws.flatMap((d) => d[1]);
const allStars = draws.flatMap((d) => d[2]);
export const mainFreq: Record<number, number> = {};
allMain.forEach((n) => (mainFreq[n] = (mainFreq[n] || 0) + 1));
export const starFreq: Record<number, number> = {};
allStars.forEach((s) => (starFreq[s] = (starFreq[s] || 0) + 1));

export const mainSorted = Object.entries(mainFreq)
  .map(([n, c]) => ({ n: +n, c }))
  .sort((a, b) => b.c - a.c);
export const starSorted = Object.entries(starFreq)
  .map(([n, c]) => ({ n: +n, c }))
  .sort((a, b) => b.c - a.c);

export const maxMF = Math.max(...Object.values(mainFreq));
export const maxSF = Math.max(...Object.values(starFreq));
export const mainRanks = Object.fromEntries(mainSorted.map((x, i) => [x.n, i + 1]));
export const starRanks = Object.fromEntries(starSorted.map((x, i) => [x.n, i + 1]));
export const avgSum = mean(draws.map((d) => d[1].reduce((a, b) => a + b, 0)));

// ── outlier analysis ──────────────────────────────────────────────────────────
export const outlierDist = [0, 0, 0, 0, 0, 0];
export const posOutlierCount = [0, 0, 0, 0, 0];
export const posOutlierBelow = [0, 0, 0, 0, 0]; // count below Q1
export const posOutlierAbove = [0, 0, 0, 0, 0]; // count above Q3
draws.forEach((d) => {
  let cnt = 0;
  d[1].forEach((n, i) => {
    if (n < iqrs[i].q1) { cnt++; posOutlierCount[i]++; posOutlierBelow[i]++; }
    else if (n > iqrs[i].q3) { cnt++; posOutlierCount[i]++; posOutlierAbove[i]++; }
  });
  outlierDist[cnt]++;
});
export const outlierPcts = outlierDist.map((c) => +(c / N * 100).toFixed(1));

// Historical min/max actually observed per position (hard bounds for generator)
export const posHistoricalMin = Array.from({ length: 5 }, (_, i) => Math.min(...draws.map((d) => d[1][i])));
export const posHistoricalMax = Array.from({ length: 5 }, (_, i) => Math.max(...draws.map((d) => d[1][i])));

// ── consecutive pairs ─────────────────────────────────────────────────────────
export const consecDraws = draws.filter((d) => {
  const b = srt(d[1]);
  return b.some((_, i) => i > 0 && b[i] - b[i - 1] === 1);
}).length;

// ── star pairs ────────────────────────────────────────────────────────────────
const starPairMap: Record<string, number> = {};
draws.forEach((d) => {
  const k = srt(d[2]).join(",");
  starPairMap[k] = (starPairMap[k] || 0) + 1;
});
export const starPairs = Object.entries(starPairMap)
  .map(([k, c]) => ({ pair: k.split(",").map(Number), c }))
  .sort((a, b) => b.c - a.c);

// ── co-occurrence matrices ────────────────────────────────────────────────────
export const coMat: Record<number, Record<number, number>> = {};
for (let i = 1; i <= 50; i++) { coMat[i] = {}; for (let j = 1; j <= 50; j++) coMat[i][j] = 0; }
draws.forEach((d) => d[1].forEach((a, ai) => d[1].forEach((b, bi) => { if (ai !== bi) coMat[a][b]++; })));

export const sMat: Record<number, Record<number, number>> = {};
for (let i = 1; i <= 12; i++) { sMat[i] = {}; for (let j = 1; j <= 12; j++) sMat[i][j] = 0; }
draws.forEach((d) => { const [s1, s2] = d[2]; sMat[s1][s2]++; sMat[s2][s1]++; });

// ── box plot helper ───────────────────────────────────────────────────────────
export interface BoxData {
  min: number; max: number; med: number; q1: number; q3: number;
  loWhisker: number; hiWhisker: number; outliers: number[];
}
export function boxData(vals: number[]): BoxData {
  const s = srt(vals);
  const mn = s[0], mx = s[s.length - 1];
  const med = median(vals), q1v = q1(vals), q3v = q3(vals);
  const iqr = q3v - q1v;
  const lo = Math.max(mn, q1v - 1.5 * iqr);
  const hi = Math.min(mx, q3v + 1.5 * iqr);
  const outliers = [...new Set(s.filter((v) => v < lo || v > hi))];
  return { min: mn, max: mx, med: med, q1: q1v, q3: q3v, loWhisker: lo, hiWhisker: hi, outliers };
}

// ── outlier correlation matrix ────────────────────────────────────────────────
// condOutlierMatrix[i][j] = P(position j is outlier | position i is outlier)
// Computed from 428 draws. -1 = same position (diagonal).
export const condOutlierMatrix: number[][] = [
  [  -1, 0.534, 0.510, 0.451, 0.413],
  [0.553,   -1, 0.663, 0.503, 0.452],
  [0.530, 0.667,   -1, 0.591, 0.449],
  [0.503, 0.541, 0.632,   -1, 0.524],
  [0.450, 0.476, 0.471, 0.513,   -1],
];

// Base outlier rate per position (used as prior when nothing is known)
export const baseOutlierRates = [0.481, 0.465, 0.463, 0.432, 0.442];

// Joint conditional lookup: key = sorted pinned positions e.g. "0,1"
// value = array of length 5, entry i = P(pos i outlier | all pinned), -1 if pinned
export const jointCondOutlier: Record<string, number[]> = {
  // Single
  "0": [  -1, 0.534, 0.510, 0.451, 0.413],
  "1": [0.553,   -1, 0.663, 0.503, 0.452],
  "2": [0.530, 0.667,   -1, 0.591, 0.449],
  "3": [0.503, 0.541, 0.632,   -1, 0.524],
  "4": [0.450, 0.476, 0.471, 0.513,   -1],
  // Double
  "0,1": [  -1,   -1, 0.700, 0.500, 0.418],
  "0,2": [  -1, 0.733,   -1, 0.600, 0.410],
  "0,3": [  -1, 0.591, 0.677,   -1, 0.484],
  "0,4": [  -1, 0.541, 0.506, 0.529,   -1],
  "1,2": [0.583,   -1,   -1, 0.621, 0.470],
  "1,3": [0.550, -1, 0.820,   -1, 0.540],
  "1,4": [0.511,   -1, 0.689, 0.600,   -1],
  "2,3": [0.538, 0.701,   -1,   -1, 0.521],
  "2,4": [0.483, 0.697,   -1, 0.685,   -1],
  "3,4": [0.464, 0.557, 0.629,   -1,   -1],
  // Triple
  "0,1,2": [  -1,   -1,   -1, 0.636, 0.429],
  "0,1,3": [  -1,   -1, 0.891,   -1, 0.511],
  "0,1,4": [  -1,   -1, 0.717, 0.609,   -1],
  "0,2,3": [  -1, 0.778,   -1,   -1, 0.460],
  "0,2,4": [  -1, 0.767,   -1, 0.674,   -1],
  "0,3,4": [  -1, 0.622, 0.644,   -1,   -1],
  "1,2,3": [0.598,   -1,   -1,   -1, 0.524],
  "1,2,4": [0.532,   -1,   -1, 0.694,   -1],
  "1,3,4": [0.519,   -1, 0.796,   -1,   -1],
  "2,3,4": [0.475, 0.705,   -1,   -1,   -1],
  // Quad (only one free position each)
  "0,1,2,3": [  -1,   -1,   -1,   -1, 0.449],
  "0,1,2,4": [  -1,   -1,   -1, 0.644,   -1],
  "0,1,3,4": [  -1,   -1, 0.727,   -1,   -1],
  "0,2,3,4": [  -1, 0.718,   -1,   -1,   -1],
  "1,2,3,4": [0.508,   -1,   -1,   -1,   -1],
};

// Consecutive pair rate by outlier count in that draw
export const consecByOutlierCount = [0.125, 0.217, 0.422, 0.356, 0.358, 0.304];

// Odd-ball count distribution (index = number of odd balls in draw)
export const oddDist = [0.016, 0.145, 0.339, 0.332, 0.152, 0.016];
// Low-ball count distribution (index = count of balls ≤25 in draw)
export const lowDist = [0.019, 0.159, 0.332, 0.371, 0.103, 0.016];

// Sum quartiles
export const sumQ1 = 114;
export const sumQ3 = 149;

// ── weighted random ───────────────────────────────────────────────────────────
export function weightedRandom(weights: Record<number, number>): number {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(weights)) { r -= w; if (r <= 0) return +k; }
  return +Object.keys(weights)[Object.keys(weights).length - 1];
}

export { N, srt };
