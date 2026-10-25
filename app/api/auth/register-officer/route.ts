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
  passwordProblem,
  BCRYPT_COST,
  normalizeUsername,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createLimiter(10, 60 * 60 * 1000);

/** Officer sign-up. The account stays unapproved until a state admin approves it. */
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
  const designation = cleanName(body.designation);
  if (!isValidName(displayName)) {
    return apiError("err_name");
  }
  if (!USERNAME_RE.test(username)) {
    return apiError("err_username");
  }
  const pwProblem = passwordProblem(body.password, username);
  if (pwProblem) return apiError(pwProblem);
  if (!isValidName(designation)) {
    return apiError("err_designation");
  }
  if (!isId(body.panchayat_id)) {
    return apiError("choose_panchayat_err");
  }

  try {
    const db = supabaseAdmin();
    const { data: panchayat, error: pErr } = await db
      .from("panchayats")
      .select("id, district_id")
      .eq("id", body.panchayat_id)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!panchayat) return apiError("err_unknown_place");

    const passwordHash = await bcrypt.hash(body.password as string, BCRYPT_COST);
    const { data, error } = await db
      .from("profiles")
      .insert({
        username,
        password_hash: passwordHash,
        display_name: displayName,
        role: "panchayat_officer",
        district_id: panchayat.district_id,
        panchayat_id: panchayat.id,
        designation,
        approved: false,
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

    const res = NextResponse.json({ ok: true, pending: true }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, encodeSession(data.id), {
      ...sessionCookieOptions,
      maxAge: SESSION_MAX_AGE_S,
    });
    return res;
  } catch (err) {
    console.error("[api/auth/register-officer] failed", err);
    return apiError("genericError", 500);
  }
}
