import "server-only";
import type { FacilityKind } from "@/lib/facilityKinds";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPanchayatAlerts, one, type AreaAlert } from "@/lib/area";
import { RED_THRESHOLD, windowStart } from "@/lib/redLogic";

/** A ward is on WATCH when it has at least this many reports in the window (but is not red). */
export const WATCH_THRESHOLD = 2;
/** Published alerts newer than this are shown on the public ward page. */
export { FACILITY_KINDS, type FacilityKind } from "@/lib/facilityKinds";
const ALERT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type Level = "safe" | "watch" | "red";
type Named = { name_en: string; name_ml: string; name_hi: string | null };
export type WardPlace = {
  wardId: number;
  number: number;
  name: string | null;
  panchayatId: number;
  panchayat: Named;
  district: Named | null;
};
export type WardStatus = {
  place: WardPlace;
  level: Level;
  /** Illnesses behind a red or watch level. Names only: no counts, no people. */
  diseases: (Named & { slug: string })[];
  alerts: AreaAlert[];
};


export type Facility = {
  id: number;
  name: string;
  kind: FacilityKind;
  phone: string | null;
  address: string | null;
  open_24h: boolean;
};

export async function getWardPlace(wardId: number): Promise<WardPlace | null> {
  const { data, error } = await supabaseAdmin()
    .from("wards")
    .select("id, number, name, panchayat_id, panchayats(name_en, name_ml, name_hi, districts(name_en, name_ml, name_hi))")
    .eq("id", wardId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const p = one(data.panchayats as unknown as (Named & { districts: unknown }) | null);
  if (!p) return null;
  return {
    wardId: data.id,
    number: data.number,
    name: data.name,
    panchayatId: data.panchayat_id,
    panchayat: { name_en: p.name_en, name_ml: p.name_ml, name_hi: p.name_hi },
    district: one(p.districts as Named | null),
  };
}

/** Level of one ward with the same red rule as the officer dashboard (per illness, in the window). */
export async function getWardStatus(wardId: number): Promise<WardStatus | null> {
  const place = await getWardPlace(wardId);
  if (!place) return null;

  const since = windowStart().toISOString();
  const [rep, alerts] = await Promise.all([
    supabaseAdmin()
      .from("reports")
      .select("disease_id")
      .eq("ward_id", wardId)
      .gte("created_at", since)
      // Up to 1000 rows (the API row cap). The level needs only 5 reports of one illness.
      .limit(1000),
    getPanchayatAlerts(place.panchayatId, { publishedOnly: true, limit: 30 }),
  ]);
  if (rep.error) throw rep.error;

  const per = new Map<number, number>();
  let total = 0;
  for (const r of rep.data ?? []) {
    total += 1;
    if (r.disease_id) per.set(r.disease_id, (per.get(r.disease_id) ?? 0) + 1);
  }
  const redIds = Array.from(per.entries()).filter(([, n]) => n >= RED_THRESHOLD).map(([id]) => id);
  const level: Level = redIds.length > 0 ? "red" : total >= WATCH_THRESHOLD ? "watch" : "safe";
  const showIds =
    level === "red"
      ? redIds
      : level === "watch"
        ? Array.from(per.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
        : [];

  let diseases: WardStatus["diseases"] = [];
  if (showIds.length) {
    const d = await supabaseAdmin().from("diseases").select("id, slug, name_en, name_ml, name_hi").in("id", showIds);
    if (d.error) throw d.error;
    diseases = (d.data ?? []).sort((a, b) => showIds.indexOf(a.id) - showIds.indexOf(b.id));
  }

  const cutoff = Date.now() - ALERT_MAX_AGE_MS;
  const forWard = alerts
    .filter((a) => a.target === "all" || a.wards.some((w) => w.id === wardId))
    .filter((a) => Date.parse(a.published_at ?? a.created_at) >= cutoff)
    .slice(0, 3);

  return { place, level, diseases, alerts: forWard };
}

export async function getFacilities(panchayatId: number): Promise<Facility[]> {
  const { data, error } = await supabaseAdmin()
    .from("health_facilities")
    .select("id, name, kind, phone, address, open_24h")
    .eq("panchayat_id", panchayatId)
    .order("kind")
    .order("name")
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Facility[];
}

/** Google Maps search link. Uses only the place name; no personal data. */
export function mapLink(...parts: (string | null | undefined)[]): string {
  const q = parts.filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Digits and + only, for a tel: link. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}
