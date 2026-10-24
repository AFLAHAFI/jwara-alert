import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { decodeSession } from "@/lib/session";
import { getT } from "@/lib/i18n/server";

export type Role = "state_admin" | "panchayat_officer" | "asha" | "citizen";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  role: Role;
  district_id: number | null;
  panchayat_id: number | null;
  ward_id: number | null;
  designation: string | null;
  approved: boolean;
  disabled: boolean;
  lang: string | null;
  birth_year: number | null;
  lives_alone: boolean;
  family_phone: string | null;
  is_elder: boolean;
  large_text: boolean;
  created_at: string;
};

/** Officer or ASHA: an approved account tied to a panchayat. */
export type ScopedUser = Profile & { panchayat_id: number };

/** Never includes password_hash. */
export const PROFILE_COLS =
  "id, username, display_name, role, district_id, panchayat_id, ward_id, designation, approved, disabled, lang, birth_year, lives_alone, family_phone, is_elder, large_text, created_at";

/**
 * Current user from the session cookie, or null. Never throws: a missing SESSION_SECRET
 * or a missing table must not break pages that do not need an account (e.g. /report).
 */
export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const raw = cookies().get("jwara_session")?.value;
  if (!raw) return null;
  try {
    const uid = decodeSession(raw);
    if (!uid) return null;
    const { data, error } = await supabaseAdmin()
      .from("profiles")
      .select(PROFILE_COLS)
      .eq("id", uid)
      .maybeSingle();
    if (error) throw error;
    const user = (data as Profile | null) ?? null;
    // A disabled account (e.g. an ASHA switched off by the officer) behaves as logged out.
    return user && !user.disabled ? user : null;
  } catch (err) {
    console.error("[authz] getCurrentUser failed", err);
    return null;
  }
});

type Ok = { user: Profile; error?: undefined };
type Denied = { user?: undefined; error: NextResponse };

/** API guard. 401 without a session, 403 for a wrong role or an unapproved account. */
export async function requireRole(roles: Role[]): Promise<Ok | Denied> {
  const { t } = getT();
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: t.err_login_needed }, { status: 401 }) };
  if (!user.approved) {
    return { error: NextResponse.json({ error: t.err_waiting }, { status: 403 }) };
  }
  if (!roles.includes(user.role)) {
    return { error: NextResponse.json({ error: t.err_not_allowed }, { status: 403 }) };
  }
  return { user };
}

/** API guard for officer/ASHA routes: approved, right role, and tied to a panchayat. */
export async function requireScoped(
  roles: Role[],
): Promise<{ user: ScopedUser; error?: undefined } | Denied> {
  const r = await requireRole(roles);
  if (r.error) return r;
  if (r.user.panchayat_id === null) {
    return { error: NextResponse.json({ error: getT().t.err_not_allowed }, { status: 403 }) };
  }
  return { user: r.user as ScopedUser };
}

/** state_admin may touch every panchayat; officers and ASHAs only their own. */
export function canAccessPanchayat(user: Profile, panchayatId: number): boolean {
  if (user.role === "state_admin") return true;
  return user.panchayat_id !== null && user.panchayat_id === panchayatId;
}

export const ROLE_HOME: Record<Role, string> = {
  state_admin: "/home/admin",
  panchayat_officer: "/home/officer",
  asha: "/home/asha",
  citizen: "/home/citizen",
};

export const ROLE_LABEL: Record<Role, { ml: string; en: string }> = {
  state_admin: { ml: "സംസ്ഥാന അഡ്മിൻ", en: "State admin" },
  panchayat_officer: { ml: "പഞ്ചായത്ത് ഉദ്യോഗസ്ഥൻ", en: "Panchayat officer" },
  asha: { ml: "ആശാ പ്രവർത്തക", en: "ASHA worker" },
  citizen: { ml: "പൗരൻ", en: "Citizen" },
};
