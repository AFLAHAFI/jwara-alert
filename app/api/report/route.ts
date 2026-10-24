import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidWard, REPORT_COOKIE, REPORT_COOLDOWN_MS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side cooldown: 1 report per 10 minutes per phone.
 * We store nothing about the phone in the database. The check uses an
 * httpOnly cookie holding only the last-report timestamp, so a user who
 * clears localStorage still hits the server check.
 */
export async function POST(req: Request) {
  let body: { ward?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!isValidWard(body.ward)) {
    return NextResponse.json({ error: "Please choose a ward (1-10)" }, { status: 400 });
  }

  const jar = cookies();
  const last = Number(jar.get(REPORT_COOKIE)?.value ?? 0);
  const elapsed = Date.now() - last;
  if (last && elapsed < REPORT_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "Already reported recently", retryAfterMs: REPORT_COOLDOWN_MS - elapsed },
      { status: 429 },
    );
  }

  try {
    const { error } = await supabaseAdmin().from("reports").insert({ ward: body.ward });
    if (error) throw error;
  } catch (err) {
    console.error("[api/report] insert failed", err);
    return NextResponse.json({ error: "Could not save report" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(REPORT_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.ceil(REPORT_COOLDOWN_MS / 1000),
    path: "/",
  });
  return res;
}
