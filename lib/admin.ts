import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { RED_THRESHOLD, windowStart } from "@/lib/redLogic";

type Named = { name_en: string; name_ml: string; name_hi: string | null };
export type DistrictRow = Named & { id: number };
export type PanchayatRow = Named & { id: number; district_id: number };
export type DiseaseRow = Named & { id: number; slug: string };
export type OfficerRow = {
  id: string;
  username: string;
  display_name: string;
  designation: string | null;
  panchayat_id: number | null;
  approved: boolean;
  disabled: boolean;
  created_at: string;
};

export type RedWard = {
  districtId: number;
  panchayatId: number;
  wardId: number;
  wardNumber: number;
  wardName: string | null;
  diseaseId: number;
  count: number;
  alerted: "sent" | "draft" | "none";
};

export type AreaStats = { reports: number; redWards: number; alerts: number };

export type StateOverview = {
  districts: DistrictRow[];
  panchayats: PanchayatRow[];
  diseases: DiseaseRow[];
  officers: OfficerRow[];
  totals: AreaStats & { openVisits: number; doneVisits: number; homesVisited: number; referred: number };
  byDistrict: Map<number, AreaStats>;
  byPanchayat: Map<number, AreaStats>;
  byDisease: Map<number, number>;
  redWards: RedWard[];
};

const PAGE = 1000;

async function pageAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

/** Kerala-wide numbers for the state admin, for the red-rule window. Read-only. */
export async function getStateOverview(): Promise<StateOverview> {
  const db = supabaseAdmin();
  const since = windowStart();
  const sinceIso = since.toISOString();

  const [districts, panchayats, wards, diseases, officers, reports, alerts, openTasks, doneTasks, visits] = await Promise.all([
    db.from("districts").select("id, name_en, name_ml, name_hi").order("name_en"),
    db.from("panchayats").select("id, district_id, name_en, name_ml, name_hi").order("name_en"),
    pageAll<{ id: number; panchayat_id: number; number: number; name: string | null }>((a, b) =>
      db.from("wards").select("id, panchayat_id, number, name").order("id").range(a, b),
    ),
    db.from("diseases").select("id, slug, name_en, name_ml, name_hi").order("sort_order"),
    db
      .from("profiles")
      .select("id, username, display_name, designation, panchayat_id, approved, disabled, created_at")
      .eq("role", "panchayat_officer")
      .order("created_at", { ascending: false }),
    pageAll<{ panchayat_id: number; ward_id: number | null; disease_id: number | null }>((a, b) =>
      db
        .from("reports")
        .select("panchayat_id, ward_id, disease_id")
        .not("panchayat_id", "is", null)
        .gte("created_at", sinceIso)
        .order("created_at")
        .range(a, b),
    ),
    pageAll<{ id: string; panchayat_id: number; disease_id: number | null; target: string; status: string; alert_wards: { ward_id: number }[] | null }>(
      (a, b) =>
        db
          .from("alerts")
          .select("id, panchayat_id, disease_id, target, status, alert_wards(ward_id)")
          .not("panchayat_id", "is", null)
          .gte("created_at", sinceIso)
          .order("created_at")
          .range(a, b),
    ),
    db.from("tasks").select("id", { count: "exact", head: true }).not("panchayat_id", "is", null).eq("done", false),
    db.from("tasks").select("id", { count: "exact", head: true }).not("panchayat_id", "is", null).eq("done", true),
    pageAll<{ visit_homes: number | null; visit_referred: number | null }>((a, b) =>
      db
        .from("tasks")
        .select("visit_homes, visit_referred")
        .not("panchayat_id", "is", null)
        .eq("done", true)
        .order("created_at")
        .range(a, b),
    ),
  ]);
  for (const r of [districts, panchayats, diseases, officers, openTasks, doneTasks]) if (r.error) throw r.error;

  const pById = new Map((panchayats.data ?? []).map((p) => [p.id, p]));
  const wById = new Map(wards.map((w) => [w.id, w]));

  // ward -> disease -> count
  const cell = new Map<string, number>();
  const byDisease = new Map<number, number>();
  const byPanchayat = new Map<number, AreaStats>();
  const byDistrict = new Map<number, AreaStats>();
  const stat = (m: Map<number, AreaStats>, k: number) => {
    let s = m.get(k);
    if (!s) m.set(k, (s = { reports: 0, redWards: 0, alerts: 0 }));
    return s;
  };

  for (const r of reports) {
    const p = pById.get(r.panchayat_id);
    if (!p) continue;
    stat(byPanchayat, p.id).reports += 1;
    stat(byDistrict, p.district_id).reports += 1;
    if (r.disease_id) byDisease.set(r.disease_id, (byDisease.get(r.disease_id) ?? 0) + 1);
    if (r.ward_id && r.disease_id) {
      const k = `${r.ward_id}:${r.disease_id}`;
      cell.set(k, (cell.get(k) ?? 0) + 1);
    }
  }

  let alertCount = 0;
  for (const a of alerts) {
    if (a.status !== "published") continue;
    alertCount += 1;
    const p = pById.get(a.panchayat_id);
    if (!p) continue;
    stat(byPanchayat, p.id).alerts += 1;
    stat(byDistrict, p.district_id).alerts += 1;
  }

  const redWards: RedWard[] = [];
  const redWardSet = new Set<number>();
  for (const [k, count] of Array.from(cell.entries())) {
    if (count < RED_THRESHOLD) continue;
    const [wardId, diseaseId] = k.split(":").map(Number);
    const w = wById.get(wardId);
    const p = w ? pById.get(w.panchayat_id) : undefined;
    if (!w || !p) continue;
    let alerted: RedWard["alerted"] = "none";
    for (const a of alerts) {
      if (a.panchayat_id !== p.id || a.disease_id !== diseaseId) continue;
      const covers = a.target === "all" || (a.alert_wards ?? []).some((x) => x.ward_id === wardId);
      if (!covers) continue;
      if (a.status === "published") {
        alerted = "sent";
        break;
      }
      alerted = "draft";
    }
    redWards.push({ districtId: p.district_id, panchayatId: p.id, wardId, wardNumber: w.number, wardName: w.name, diseaseId, count, alerted });
    if (!redWardSet.has(wardId)) {
      redWardSet.add(wardId);
      stat(byPanchayat, p.id).redWards += 1;
      stat(byDistrict, p.district_id).redWards += 1;
    }
  }
  // Not-yet-alerted first, then the biggest clusters.
  const order = { none: 0, draft: 1, sent: 2 };
  redWards.sort((a, b) => order[a.alerted] - order[b.alerted] || b.count - a.count);

  return {
    districts: (districts.data ?? []) as DistrictRow[],
    panchayats: (panchayats.data ?? []) as PanchayatRow[],
    diseases: (diseases.data ?? []) as DiseaseRow[],
    officers: (officers.data ?? []) as OfficerRow[],
    totals: {
      reports: reports.length,
      redWards: redWardSet.size,
      alerts: alertCount,
      openVisits: openTasks.count ?? 0,
      doneVisits: doneTasks.count ?? 0,
      homesVisited: visits.reduce((s, v) => s + (v.visit_homes ?? 0), 0),
      referred: visits.reduce((s, v) => s + (v.visit_referred ?? 0), 0),
    },
    byDistrict,
    byPanchayat,
    byDisease,
    redWards,
  };
}

