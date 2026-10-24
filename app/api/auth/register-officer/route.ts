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

const limiter = createLimiter(10, 60 * 60 * 1000);

/** Officer sign-up. The account stays unapproved until a state admin approves it. */
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
  const designation = cleanName(body.designation);
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
  if (!isValidName(designation)) {
    return NextResponse.json({ error: "Please enter your designation" }, { status: 400 });
  }
  if (!isId(body.panchayat_id)) {
    return NextResponse.json({ error: "Please choose district and panchayat" }, { status: 400 });
  }

  try {
    const db = supabaseAdmin();
    const { data: panchayat, error: pErr } = await db
      .from("panchayats")
      .select("id, district_id")
      .eq("id", body.panchayat_id)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!panchayat) return NextResponse.json({ error: "Unknown panchayat" }, { status: 400 });

    const passwordHash = await bcrypt.hash(body.password, 10);
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
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
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
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }
}
