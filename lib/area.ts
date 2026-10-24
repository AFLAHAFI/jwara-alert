import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Profile } from "@/lib/authz";
import { windowStart } from "@/lib/redLogic";

export type Disease = {
  id: number;
  slug: string;
  name_en: string;
  name_ml: string;
  citizen_selectable: boolean;
};
export type WardRow = { id: number; number: number };
export type PanchayatInfo = {
  id: number;
  name_en: string;
  name_ml: string;
  district_en: string;
  district_ml: string;
};

/** Supabase returns an embedded to-one relation as an object or a 1-item array. */
export function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function getDiseases(opts: { citizenOnly?: boolean } = {}): Promise<Disease[]> {
  let q = supabaseAdmin()
    .from("diseases")
    .select("id, slug, name_en, name_ml, citizen_selectable")
    .order("sort_order");
  if (opts.citizenOnly) q = q.eq("citizen_selectable", true);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getPanchayat(id: number): Promise<PanchayatInfo | null> {
  const { data, error } = await supabaseAdmin()
    .from("panchayats")
    .select("id, name_en, name_ml, districts(name_en, name_ml)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d = one(data.districts as unknown as { name_en: string; name_ml: string } | null);
  return {
    id: data.id,
    name_en: data.name_en,
    name_ml: data.name_ml,
    district_en: d?.name_en ?? "",
    district_ml: d?.name_ml ?? "",
  };
}

export async function getWards(panchayatId: number): Promise<WardRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("wards")
    .select("id, number")
    .eq("panchayat_id", panchayatId)
    .order("number");
  if (error) throw error;
  return data ?? [];
}

export async function getWardNumber(wardId: number | null): Promise<number | null> {
  if (!wardId) return null;
  const { data } = await supabaseAdmin().from("wards").select("number").eq("id", wardId).maybeSingle();
  return data?.number ?? null;
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

export type AreaAlert = {
  id: string;
  body_ml: string;
  status: "draft" | "published";
  target: "all" | "wards";
  created_at: string;
  published_at: string | null;
  disease: { id: number; name_en: string; name_ml: string; slug: string } | null;
  wards: { id: number; number: number }[];
};

const ALERT_SELECT =
  "id, body_ml, status, target, created_at, published_at, diseases(id, slug, name_en, name_ml), alert_wards(wards(id, number))";

type RawAlert = {
  id: string;
  body_ml: string;
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
  asha_name: string | null;
  disease_en: string | null;
  disease_ml: string | null;
};

const TASK_SELECT =
  "id, alert_id, assigned_to, title, done, done_at, due_date, created_at, wards(number), profiles!tasks_assigned_to_fkey(display_name), alerts(diseases(name_en, name_ml))";

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
  const disease = one(alert?.diseases as { name_en: string; name_ml: string } | null);
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
    asha_name: one(t.profiles as { display_name: string } | null)?.display_name ?? null,
    disease_en: disease?.name_en ?? null,
    disease_ml: disease?.name_ml ?? null,
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
