/**
 * Seeds FAKE EXAMPLE fever reports for 10 wards over the last 3 days.
 * Ward 3 -> 6 reports and Ward 7 -> 5 reports (both RED), others 0-3.
 *
 *   node --env-file=.env.local --import tsx scripts/seed.ts
 *   node --env-file=.env.local --import tsx scripts/seed.ts --reset   # wipe reports/alerts/tasks first
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. via --env-file=.env.local)");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();

/** Deterministic pseudo-random so the demo looks the same every run. */
let seed = 42;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

/** Spread `n` reports over the last `days` days, mostly during daytime. */
function times(n: number, days: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const day = Math.floor((i * days) / n);
    const hour = 7 + Math.floor(rand() * 13);
    const ts = now - day * DAY - (hour - 12) * HOUR - rand() * HOUR;
    return new Date(Math.min(ts, now - 60_000)).toISOString();
  });
}

const plan: Record<number, string[]> = {
  1: times(2, 3),
  2: times(1, 3),
  3: times(6, 2), // RED
  4: times(0, 3),
  5: times(3, 3),
  6: times(1, 3),
  7: times(5, 2), // RED
  8: times(2, 3),
  9: times(0, 3),
  10: times(3, 3),
};

async function main() {
  if (process.argv.includes("--reset")) {
    for (const table of ["tasks", "alerts", "reports"]) {
      const { error } = await db.from(table).delete().not("id", "is", null);
      if (error) throw error;
      console.log(`cleared ${table}`);
    }
  }

  const rows = Object.entries(plan).flatMap(([ward, ts]) =>
    ts.map((created_at) => ({ ward: Number(ward), created_at })),
  );
  const { error } = await db.from("reports").insert(rows);
  if (error) throw error;

  console.log(`inserted ${rows.length} example reports:`);
  for (const [ward, ts] of Object.entries(plan)) console.log(`  ward ${ward}: ${ts.length}`);
  console.log("Expect Ward 3 and Ward 7 to be RED on /dashboard.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
