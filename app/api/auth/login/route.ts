import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { SESSION_COOKIE, SESSION_MAX_AGE_S, encodeSession, sessionCookieOptions } from "@/lib/session";
import { normalizeUsername } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createLimiter(8, 15 * 60 * 1000);
// Compared against when the username does not exist, so timing does not reveal valid usernames.
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.Qy4mQ9Qk9nJmZ1b3Zy2k8bZ6cH8W";

export async function POST(req: Request) {
  let body: { username?: unknown; password?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const username = normalizeUsername(body?.username);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password || password.length > 200) {
    return NextResponse.json({ error: "Username or password is wrong" }, { status: 401 });
  }

  const key = `${clientIp(req)}|${username}`;
  if (!limiter.hit(key)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("profiles")
      .select("id, password_hash, role, approved, disabled")
      .eq("username", username)
      .maybeSingle();
    if (error) throw error;

    const ok = await bcrypt.compare(password, data?.password_hash ?? DUMMY_HASH);
    if (!data || !ok) {
      return NextResponse.json({ error: "Username or password is wrong" }, { status: 401 });
    }

    if (data.disabled) {
      return NextResponse.json({ error: "This account is switched off. Contact your officer." }, { status: 403 });
    }
    limiter.reset(key);
    const res = NextResponse.json({ ok: true, role: data.role, approved: data.approved });
    res.cookies.set(SESSION_COOKIE, encodeSession(data.id), {
      ...sessionCookieOptions,
      maxAge: SESSION_MAX_AGE_S,
    });
    return res;
  } catch (err) {
    console.error("[api/auth/login] failed", err);
    return NextResponse.json({ error: "Could not log in. Please retry." }, { status: 500 });
  }
}
