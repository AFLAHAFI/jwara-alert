import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createLimiter } from "@/lib/rateLimit";
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
    return NextResponse.json({ error: "Too many sign-ups. Try again later." }, { status: 429 });
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const displayName = cleanName(body.display_name);
  const username = normalizeUsername(body.username);
  if (!isValidName(displayName)) {
    return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
  }
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username: 3-30 letters, numbers, dot or underscore" },
      { status: 400 },
    );
  }
  if (!isValidPassword(body.password)) {
    return NextResponse.json({ error: "Password must be 6-72 characters" }, { status: 400 });
  }
  if (!isId(body.ward_id)) {
    return NextResponse.json({ error: "Please choose district, panchayat and ward" }, { status: 400 });
  }

  try {
    const db = supabaseAdmin();
    const { data: ward, error: wardErr } = await db
      .from("wards")
      .select("id, panchayat_id, panchayats(district_id)")
      .eq("id", body.ward_id)
      .maybeSingle();
    if (wardErr) throw wardErr;
    if (!ward) return NextResponse.json({ error: "Unknown ward" }, { status: 400 });
    const panchayat = ward.panchayats as unknown as { district_id: number } | { district_id: number }[] | null;
    const districtId = Array.isArray(panchayat) ? panchayat[0]?.district_id : panchayat?.district_id;
    if (!districtId) return NextResponse.json({ error: "Unknown ward" }, { status: 400 });

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
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
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
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }
}
