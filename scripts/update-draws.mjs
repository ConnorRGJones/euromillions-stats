/**
 * Fetches the latest EuroMillions draw and prepends it to src/lib/data.ts
 * if it isn't already present.
 *
 * Data source: https://euromillions.api.pedromealha.dev
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../src/lib/data.ts");

// ── 1. Fetch latest draw ────────────────────────────────────────────────────
async function fetchLatestDraw() {
  const res = await fetch("https://euromillions.api.pedromealha.dev/draws");
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();

  // API returns array oldest→newest; take the last entry
  const latest = data[data.length - 1];

  // date format: "Tue, 02 Jun 2026 00:00:00 GMT"
  const raw = new Date(latest.date);
  const dd = String(raw.getUTCDate()).padStart(2, "0");
  const mm = String(raw.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = raw.getUTCFullYear();
  const dateStr = `${dd}-${mm}-${yyyy}`;

  const balls = latest.numbers.map(Number).sort((a, b) => a - b);
  const stars = latest.stars.map(Number).sort((a, b) => a - b);

  return { dateStr, balls, stars };
}

// ── 2. Read existing data ───────────────────────────────────────────────────
function getExistingDates(content) {
  return [...content.matchAll(/"(\d{2}-\d{2}-\d{4})"/g)].map((m) => m[1]);
}

// ── 3. Build new entry ──────────────────────────────────────────────────────
function buildEntry({ dateStr, balls, stars }) {
  return `["${dateStr}",[${balls.join(",")}],[${stars.join(",")}]]`;
}

// ── 4. Append at end of array & update header comment ──────────────────────
function appendDraw(content, entry) {
  const countMatch = content.match(/\/\/ (\d+) EuroMillions draws/);
  const oldCount = countMatch ? parseInt(countMatch[1]) : 0;
  return content
    .replace(/\/\/ \d+ EuroMillions draws/, `// ${oldCount + 1} EuroMillions draws`)
    .replace(/\];\s*$/, `  ${entry},\n];`);
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log("Fetching latest EuroMillions draw...");
    const draw = await fetchLatestDraw();
    console.log(`Latest draw: ${draw.dateStr} — balls: ${draw.balls} stars: ${draw.stars}`);

    const content = readFileSync(DATA_FILE, "utf8");
    const existing = getExistingDates(content);

    if (existing.includes(draw.dateStr)) {
      console.log(`Draw ${draw.dateStr} already in data.ts — nothing to do.`);
      process.exit(0);
    }

    const updated = appendDraw(content, buildEntry(draw));
    writeFileSync(DATA_FILE, updated, "utf8");
    console.log(`✅ Added draw ${draw.dateStr} to data.ts`);

  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
})();
