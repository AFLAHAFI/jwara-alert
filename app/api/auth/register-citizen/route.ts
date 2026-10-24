import { NextResponse } from "next/server";
import { apiError } from "@/lib/i18n/api";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createLimiter } from "@/lib/rateLimit";
import { getLang } from "@/lib/i18n/server";
import { clientIp } from "@/lib/clientIp";
import { SESSION_COOKIE, SESSION_MAX_AGE_S, encodeSession, sessionCookieOptions } from "@/lib/session";
import {
  USERNAME_RE,
  cleanName,
  isId,
  isValidName,
  isValidPassword,
  normalizeUsername,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createLimiter(15, 60 * 60 * 1000);

/** Citizen sign-up. District and panchayat are derived from the ward on the server. */
export async function POST(req: Request) {
  if (!limiter.hit(clientIp(req))) {
    return apiError("err_too_many_signup", 429);
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = await req.json();
  } catch {
    return apiError("err_invalid");
  }
  if (!body || typeof body !== "object") {
    return apiError("err_invalid");
  }

  const displayName = cleanName(body.display_name);
  const username = normalizeUsername(body.username);
  if (!isValidName(displayName)) {
    return apiError("err_name");
  }
  if (!USERNAME_RE.test(username)) {
    return apiError("err_username");
  }
  if (!isValidPassword(body.password)) {
    return apiError("err_password");
  }
  if (!isId(body.ward_id)) {
    return apiError("choose_ward_err");
  }

  try {
    const db = supabaseAdmin();
    const { data: ward, error: wardErr } = await db
      .from("wards")
      .select("id, panchayat_id, panchayats(district_id)")
      .eq("id", body.ward_id)
      .maybeSingle();
    if (wardErr) throw wardErr;
    if (!ward) return apiError("err_unknown_place");
    const panchayat = ward.panchayats as unknown as { district_id: number } | { district_id: number }[] | null;
    const districtId = Array.isArray(panchayat) ? panchayat[0]?.district_id : panchayat?.district_id;
    if (!districtId) return apiError("err_unknown_place");

    const passwordHash = await bcrypt.hash(body.password, 10);
    const { data, error } = await db
      .from("profiles")
      .insert({
        username,
        password_hash: passwordHash,
        display_name: displayName,
        role: "citizen",
        district_id: districtId,
        panchayat_id: ward.panchayat_id,
        ward_id: ward.id,
        approved: true,
        lang: getLang(),
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        return apiError("err_username_taken", 409);
      }
      throw error;
    }

    const res = NextResponse.json({ ok: true }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, encodeSession(data.id), {
      ...sessionCookieOptions,
      maxAge: SESSION_MAX_AGE_S,
    });
    return res;
  } catch (err) {
    console.error("[api/auth/register-citizen] failed", err);
    return apiError("genericError", 500);
  }
}
