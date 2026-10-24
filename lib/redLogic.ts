/** A ward is RED when it has at least this many reports in the window. */
export const RED_THRESHOLD = 5;
/** Window (days) used for both the dashboard chart and the red rule. */
export const WINDOW_DAYS = 3;

export type WardCount = { ward: number; count: number };

export function isRedWard(count: number): boolean {
  return count >= RED_THRESHOLD;
}

export function windowStart(now = new Date()): Date {
  return new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export type WardDiseaseCounts = {
  wardId: number;
  number: number;
  total: number;
  /** disease_id -> count; key 0 = no disease recorded */
  byDisease: Map<number, number>;
};

/** Per-ward counts split by disease. A ward is RED for a disease at >= RED_THRESHOLD. */
export function countByWardAndDisease(
  wards: { id: number; number: number }[],
  reports: { ward_id: number | null; disease_id: number | null }[],
): WardDiseaseCounts[] {
  const map = new Map<number, WardDiseaseCounts>(
    wards.map((w) => [w.id, { wardId: w.id, number: w.number, total: 0, byDisease: new Map() }]),
  );
  for (const r of reports) {
    if (r.ward_id === null) continue;
    const row = map.get(r.ward_id);
    if (!row) continue;
    row.total += 1;
    const k = r.disease_id ?? 0;
    row.byDisease.set(k, (row.byDisease.get(k) ?? 0) + 1);
  }
  return Array.from(map.values()).sort((a, b) => a.number - b.number);
}
