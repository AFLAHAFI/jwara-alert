import { NextResponse } from "next/server";
import { apiError } from "@/lib/i18n/api";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { SESSION_COOKIE, SESSION_MAX_AGE_S, encodeSession, sessionCookieOptions } from "@/lib/session";
import { normalizeUsername } from "@/lib/validation";
import { LANG_COOKIE, isLang } from "@/lib/i18n";
import { LANG_COOKIE_OPTIONS } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createLimiter(8, 15 * 60 * 1000);
const DB_WINDOW_MS = 15 * 60 * 1000;
const DB_MAX_FAILS = 10;
// Compared against when the username does not exist, so timing does not reveal valid usernames.
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.Qy4mQ9Qk9nJmZ1b3Zy2k8bZ6cH8W";

export async function POST(req: Request) {
  let body: { username?: unknown; password?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return apiError("err_invalid");
  }
  const username = normalizeUsername(body?.username);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password || password.length > 200) {
    return apiError("err_login", 401);
  }

  const key = `${clientIp(req)}|${username}`;
  if (!limiter.hit(key)) {
    return apiError("err_too_many_login", 429);
  }

  const db = supabaseAdmin();
  const since = new Date(Date.now() - DB_WINDOW_MS).toISOString();
  try {
    // Database-backed limit per username: survives restarts and works on every server instance.
    const { count: recentFails, error: fErr } = await db
      .from("login_failures")
      .select("id", { count: "exact", head: true })
      .eq("username", username)
      .gte("at", since);
    if (fErr) throw fErr;
    if ((recentFails ?? 0) >= DB_MAX_FAILS) return apiError("err_too_many_login", 429);

    const { data, error } = await db
      .from("profiles")
      .select("id, password_hash, role, approved, disabled, lang")
      .eq("username", username)
      .maybeSingle();
    if (error) throw error;

    const ok = await bcrypt.compare(password, data?.password_hash ?? DUMMY_HASH);
    if (!data || !ok) {
      const { error: insErr } = await db.from("login_failures").insert({ username });
      if (insErr) console.error("[api/auth/login] could not record failure", insErr);
      return apiError("err_login", 401);
    }

    if (data.disabled) {
      return apiError("err_account_off", 403);
    }
    limiter.reset(key);
    await db.from("login_failures").delete().eq("username", username);
    const res = NextResponse.json({ ok: true, role: data.role, approved: data.approved });
    res.cookies.set(SESSION_COOKIE, encodeSession(data.id), {
      ...sessionCookieOptions,
      maxAge: SESSION_MAX_AGE_S,
    });
    // The account remembers its language, so a new phone opens in the same language.
    if (isLang(data.lang)) res.cookies.set(LANG_COOKIE, data.lang, LANG_COOKIE_OPTIONS);
    return res;
  } catch (err) {
    console.error("[api/auth/login] failed", err);
    return apiError("genericError", 500);
  }
}
