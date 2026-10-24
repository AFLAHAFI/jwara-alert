import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Profile } from "@/lib/authz";
import { windowStart } from "@/lib/redLogic";

export type Disease = {
  id: number;
  slug: string;
  name_en: string;
  name_ml: string;
  name_hi: string | null;
  citizen_selectable: boolean;
};
export type WardRow = { id: number; number: number; name: string | null };
export type PanchayatInfo = {
  id: number;
  name_en: string;
  name_ml: string;
  name_hi: string | null;
  district: { name_en: string; name_ml: string; name_hi: string | null };
};

/** Supabase returns an embedded to-one relation as an object or a 1-item array. */
export function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function getDiseases(opts: { citizenOnly?: boolean } = {}): Promise<Disease[]> {
  let q = supabaseAdmin()
    .from("diseases")
    .select("id, slug, name_en, name_ml, name_hi, citizen_selectable")
    .order("sort_order");
  if (opts.citizenOnly) q = q.eq("citizen_selectable", true);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getPanchayat(id: number): Promise<PanchayatInfo | null> {
  const { data, error } = await supabaseAdmin()
    .from("panchayats")
    .select("id, name_en, name_ml, name_hi, districts(name_en, name_ml, name_hi)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d = one(data.districts as unknown as PanchayatInfo["district"] | null);
  return {
    id: data.id,
    name_en: data.name_en,
    name_ml: data.name_ml,
    name_hi: data.name_hi,
    district: d ?? { name_en: "", name_ml: "", name_hi: null },
  };
}

export async function getWards(panchayatId: number): Promise<WardRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("wards")
    .select("id, number, name")
    .eq("panchayat_id", panchayatId)
    .order("number");
  if (error) throw error;
  return data ?? [];
}

export async function getWardInfo(wardId: number | null): Promise<{ number: number; name: string | null } | null> {
  if (!wardId) return null;
  const { data } = await supabaseAdmin().from("wards").select("number, name").eq("id", wardId).maybeSingle();
  return data ?? null;
}

const PAGE = 1000;

/** Reports in a panchayat inside the red-rule window (paged past the PostgREST row cap). */
export async function getWindowReports(
  panchayatId: number,
): Promise<{ ward_id: number | null; disease_id: number | null }[]> {
  const since = windowStart().toISOString();
  const rows: { ward_id: number | null; disease_id: number | null }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin()
      .from("reports")
      .select("ward_id, disease_id")
      .eq("panchayat_id", panchayatId)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

export type AlertDisease = { id: number; name_en: string; name_ml: string; name_hi: string | null; slug: string };

export type AreaAlert = {
  id: string;
  body_ml: string;
  body_en: string | null;
  body_hi: string | null;
  status: "draft" | "published";
  target: "all" | "wards";
  created_at: string;
  published_at: string | null;
  disease: AlertDisease | null;
  wards: { id: number; number: number }[];
};

const ALERT_SELECT =
  "id, body_ml, body_en, body_hi, status, target, created_at, published_at, diseases(id, slug, name_en, name_ml, name_hi), alert_wards(wards(id, number))";

type RawAlert = {
  id: string;
  body_ml: string;
  body_en: string | null;
  body_hi: string | null;
  status: "draft" | "published";
  target: "all" | "wards";
  created_at: string;
  published_at: string | null;
  diseases: unknown;
  alert_wards: { wards: unknown }[] | null;
};

function shapeAlert(a: RawAlert): AreaAlert {
  const wards = (a.alert_wards ?? [])
    .map((aw) => one(aw.wards as { id: number; number: number } | null))
    .filter((w): w is { id: number; number: number } => !!w)
    .sort((x, y) => x.number - y.number);
  return {
    id: a.id,
    body_ml: a.body_ml,
    body_en: a.body_en,
    body_hi: a.body_hi,
    status: a.status,
    target: a.target,
    created_at: a.created_at,
    published_at: a.published_at,
    disease: one(a.diseases as AreaAlert["disease"]),
    wards,
  };
}

/** Alerts of one panchayat (officer view). */
export async function getPanchayatAlerts(
  panchayatId: number,
  opts: { publishedOnly?: boolean; limit?: number } = {},
): Promise<AreaAlert[]> {
  let q = supabaseAdmin().from("alerts").select(ALERT_SELECT).eq("panchayat_id", panchayatId);
  if (opts.publishedOnly) q = q.eq("status", "published");
  const { data, error } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 100);
  if (error) throw error;
  return ((data ?? []) as RawAlert[]).map(shapeAlert);
}

/**
 * Published alerts a user should see: everything for their panchayat, except
 * ward-targeted alerts, which a citizen sees only when their ward is included.
 */
export async function getAlertsForUser(user: Profile, limit = 50): Promise<AreaAlert[]> {
  if (!user.panchayat_id) return [];
  const all = await getPanchayatAlerts(user.panchayat_id, { publishedOnly: true, limit });
  if (user.role !== "citizen") return all;
  return all.filter((a) => a.target === "all" || a.wards.some((w) => w.id === user.ward_id));
}

export type AshaRow = { id: string; username: string; display_name: string; disabled: boolean; created_at: string };

export async function getAshas(panchayatId: number): Promise<AshaRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("id, username, display_name, disabled, created_at")
    .eq("role", "asha")
    .eq("panchayat_id", panchayatId)
    .order("display_name");
  if (error) throw error;
  return data ?? [];
}

export type TaskRow = {
  id: string;
  alert_id: string;
  assigned_to: string | null;
  title: string;
  done: boolean;
  done_at: string | null;
  due_date: string | null;
  created_at: string;
  ward_number: number | null;
  ward_name: string | null;
  asha_name: string | null;
  disease: { name_en: string; name_ml: string; name_hi: string | null } | null;
};

const TASK_SELECT =
  "id, alert_id, assigned_to, title, done, done_at, due_date, created_at, wards(number, name), profiles!tasks_assigned_to_fkey(display_name), alerts(diseases(name_en, name_ml, name_hi))";

type RawTask = {
  id: string;
  alert_id: string;
  assigned_to: string | null;
  title: string;
  done: boolean;
  done_at: string | null;
  due_date: string | null;
  created_at: string;
  wards: unknown;
  profiles: unknown;
  alerts: unknown;
};

function shapeTask(t: RawTask): TaskRow {
  const alert = one(t.alerts as { diseases: unknown } | null);
  const disease = one(alert?.diseases as TaskRow["disease"]);
  return {
    id: t.id,
    alert_id: t.alert_id,
    assigned_to: t.assigned_to,
    title: t.title,
    done: t.done,
    done_at: t.done_at,
    due_date: t.due_date,
    created_at: t.created_at,
    ward_number: one(t.wards as { number: number } | null)?.number ?? null,
    ward_name: one(t.wards as { name: string | null } | null)?.name ?? null,
    asha_name: one(t.profiles as { display_name: string } | null)?.display_name ?? null,
    disease,
  };
}

/** Tasks of a panchayat (officer) or of one ASHA (assignedTo), open first. */
export async function getTasks(opts: { panchayatId?: number; assignedTo?: string }): Promise<TaskRow[]> {
  let q = supabaseAdmin().from("tasks").select(TASK_SELECT);
  if (opts.panchayatId) q = q.eq("panchayat_id", opts.panchayatId);
  if (opts.assignedTo) q = q.eq("assigned_to", opts.assignedTo);
  if (!opts.panchayatId && !opts.assignedTo) return [];
  const { data, error } = await q
    .order("done", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return ((data ?? []) as RawTask[]).map(shapeTask);
}

export type AlertStatus = "sent" | "draft" | "none";

/**
 * Has this ward been alerted about this illness in the red-rule window?
 * "sent" = a published alert for the whole panchayat or naming this ward; "draft" = only a draft.
 */
export function alertStatusFor(alerts: AreaAlert[], wardId: number, diseaseId: number, sinceMs: number): AlertStatus {
  let draft = false;
  for (const a of alerts) {
    if (a.disease?.id !== diseaseId) continue;
    if (new Date(a.created_at).getTime() < sinceMs) continue;
    const covers = a.target === "all" || a.wards.some((w) => w.id === wardId);
    if (!covers) continue;
    if (a.status === "published") return "sent";
    draft = true;
  }
  return draft ? "draft" : "none";
}

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_MS = 5.5 * 60 * 60 * 1000;

/** YYYY-MM-DD of an instant in Asia/Kolkata. */
export function kolkataDay(d: Date | string): string {
  const ms = (typeof d === "string" ? new Date(d) : d).getTime() + IST_MS;
  return new Date(ms).toISOString().slice(0, 10);
}

export type TrendSeries = { disease: Disease; counts: number[]; last3: number; prev3: number };
export type Trend = { days: string[]; series: TrendSeries[] };

/** Reports per Kolkata day for the last 7 days (today included), top illnesses only. */
export async function getTrend(panchayatId: number, diseases: Disease[], top = 3): Promise<Trend> {
  const today = kolkataDay(new Date());
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) days.push(kolkataDay(new Date(Date.parse(`${today}T00:00:00Z`) - i * DAY_MS + 1)));
  const since = new Date(Date.parse(`${days[0]}T00:00:00Z`) - IST_MS).toISOString();

  const rows: { disease_id: number | null; created_at: string }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin()
      .from("reports")
      .select("disease_id, created_at")
      .eq("panchayat_id", panchayatId)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }

  const idx = new Map(days.map((d, i) => [d, i]));
  const per = new Map<number, number[]>();
  for (const r of rows) {
    if (!r.disease_id) continue;
    const i = idx.get(kolkataDay(r.created_at));
    if (i === undefined) continue;
    const arr = per.get(r.disease_id) ?? Array(7).fill(0);
    arr[i] += 1;
    per.set(r.disease_id, arr);
  }
  const byId = new Map(diseases.map((d) => [d.id, d]));
  const series = Array.from(per.entries())
    .filter(([id]) => byId.has(id))
    .map(([id, counts]) => ({
      disease: byId.get(id)!,
      counts,
      last3: counts.slice(4).reduce((a, b) => a + b, 0),
      prev3: counts.slice(1, 4).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.counts.reduce((x, y) => x + y, 0) - a.counts.reduce((x, y) => x + y, 0))
    .slice(0, top);
  return { days, series };
}
