import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type SosRequest = {
  id: string;
  user_id: string | null;
  panchayat_id: number;
  ward_id: number | null;
  lat: number | null;
  lng: number | null;
  status: "open" | "accepted" | "resolved";
  created_at: string;
  accepted_by: string | null;
  accepted_at: string | null;
  resolved_at: string | null;
  user?: {
    display_name: string;
    family_phone: string | null;
    lives_alone: boolean;
    birth_year: number | null;
  } | null;
  ward_number?: number | null;
  ward_name?: string | null;
};

export type ElderWithCheckin = {
  id: string;
  display_name: string;
  username: string;
  ward_id: number | null;
  ward_number: number | null;
  ward_name: string | null;
  birth_year: number | null;
  lives_alone: boolean;
  family_phone: string | null;
  checked_in: boolean;
  checkin_at: string | null;
};

/** Calendar day in Asia/Kolkata timezone (YYYY-MM-DD). */
export function getKolkataToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Active SOS requests for a panchayat. */
export async function getSosRequests(
  panchayatId: number,
  statuses: ("open" | "accepted" | "resolved")[] = ["open", "accepted"],
): Promise<SosRequest[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("sos_requests")
    .select(`
      id, user_id, panchayat_id, ward_id, lat, lng, status, created_at, accepted_by, accepted_at, resolved_at,
      profiles:user_id (display_name, family_phone, lives_alone, birth_year),
      wards:ward_id (number, name)
    `)
    .eq("panchayat_id", panchayatId)
    .in("status", statuses)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data as unknown as Record<string, unknown>[]) || []).map((row) => {
    const prof = row.profiles as {
      display_name: string;
      family_phone: string | null;
      lives_alone: boolean;
      birth_year: number | null;
    } | null;
    const ward = row.wards as { number: number; name: string } | null;
    return {
      id: row.id as string,
      user_id: row.user_id as string | null,
      panchayat_id: row.panchayat_id as number,
      ward_id: row.ward_id as number | null,
      lat: (row.lat as number | null) ?? null,
      lng: (row.lng as number | null) ?? null,
      status: row.status as "open" | "accepted" | "resolved",
      created_at: row.created_at as string,
      accepted_by: (row.accepted_by as string | null) ?? null,
      accepted_at: (row.accepted_at as string | null) ?? null,
      resolved_at: (row.resolved_at as string | null) ?? null,
      user: prof ?? null,
      ward_number: ward?.number ?? null,
      ward_name: ward?.name ?? null,
    };
  });
}

/** Count of active (open or accepted) SOS requests in a panchayat. */
export async function countActiveSos(panchayatId: number): Promise<number> {
  const db = supabaseAdmin();
  const { count, error } = await db
    .from("sos_requests")
    .select("id", { count: "exact", head: true })
    .eq("panchayat_id", panchayatId)
    .in("status", ["open", "accepted"]);
  if (error) {
    console.error("[countActiveSos] failed", error);
    return 0;
  }
  return count ?? 0;
}

/** The citizen's active (open or accepted) SOS, however old: it stays on screen until the ASHA resolves it. */
export async function getActiveSosForUser(userId: string): Promise<SosRequest | null> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("sos_requests")
    .select("id, user_id, panchayat_id, ward_id, lat, lng, status, created_at, accepted_by, accepted_at, resolved_at")
    .eq("user_id", userId)
    .in("status", ["open", "accepted"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as SosRequest | null) ?? null;
}

/** Check citizen's today check-in status. */
export async function getTodayCheckinForUser(
  userId: string,
  day = getKolkataToday(),
): Promise<{ checked_in: boolean; checkin_at: string | null }> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("checkins")
    .select("created_at")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  if (error) throw error;
  return {
    checked_in: Boolean(data),
    checkin_at: (data as { created_at: string } | null)?.created_at ?? null,
  };
}

/**
 * Elders in a panchayat with today's checkin status.
 * Elders who live alone and have NOT checked in today appear FIRST.
 */
export async function getEldersInPanchayat(
  panchayatId: number,
  day = getKolkataToday(),
): Promise<ElderWithCheckin[]> {
  const db = supabaseAdmin();
  const [eldersRes, checkinsRes] = await Promise.all([
    db
      .from("profiles")
      .select("id, display_name, username, ward_id, birth_year, lives_alone, family_phone, wards:ward_id(number, name)")
      .eq("panchayat_id", panchayatId)
      .eq("is_elder", true)
      .eq("approved", true)
      .eq("disabled", false),
    db.from("checkins").select("user_id, created_at").eq("day", day),
  ]);
  if (eldersRes.error) throw eldersRes.error;
  if (checkinsRes.error) throw checkinsRes.error;

  const checkinMap = new Map<string, string>();
  for (const c of checkinsRes.data || []) {
    checkinMap.set(c.user_id, c.created_at);
  }

  type RawElder = {
    id: string;
    display_name: string;
    username: string;
    ward_id: number | null;
    birth_year: number | null;
    lives_alone: boolean;
    family_phone: string | null;
    wards: { number: number; name: string } | null;
  };

  const list: ElderWithCheckin[] = ((eldersRes.data as unknown as RawElder[]) || []).map((row) => {
    const ward = row.wards;
    const checkinTime = checkinMap.get(row.id) ?? null;
    return {
      id: row.id,
      display_name: row.display_name,
      username: row.username,
      ward_id: row.ward_id,
      ward_number: ward?.number ?? null,
      ward_name: ward?.name ?? null,
      birth_year: row.birth_year,
      lives_alone: Boolean(row.lives_alone),
      family_phone: row.family_phone ?? null,
      checked_in: Boolean(checkinTime),
      checkin_at: checkinTime,
    };
  });

  // Ordering: elders who live alone and have NOT checked in appear first, in red
  list.sort((a, b) => {
    const aPriority = !a.checked_in && a.lives_alone ? 0 : !a.checked_in ? 1 : 2;
    const bPriority = !b.checked_in && b.lives_alone ? 0 : !b.checked_in ? 1 : 2;
    if (aPriority !== bPriority) return aPriority - bPriority;
    if ((a.ward_number ?? 0) !== (b.ward_number ?? 0)) return (a.ward_number ?? 0) - (b.ward_number ?? 0);
    return a.display_name.localeCompare(b.display_name);
  });

  return list;
}
