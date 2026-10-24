import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidWard, REPORT_COOKIE, REPORT_COOLDOWN_MS } from "@/lib/constants";
import { decodeReportCookie, encodeReportCookie } from "@/lib/reportCookie";
import { getCurrentUser } from "@/lib/authz";
import { isId } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side cooldown: 1 report per 10 minutes per phone.
 * We store nothing about the phone in the database. The check uses an
 * httpOnly cookie holding only the last-report timestamp, HMAC-signed so it
 * cannot be rewound by editing it. A user who clears localStorage still hits
 * the server check. (Clearing cookies resets it; good enough for a pilot.)
 */
export async function POST(req: Request) {
  let body: { ward?: unknown; disease_id?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Logged-in citizen: ward and panchayat come from the account, never from the request.
  // The report row still stores no user id, so it stays anonymous.
  const user = await getCurrentUser();
  const citizen = user && user.role === "citizen" && user.approved && user.ward_id && user.panchayat_id;
  let row: Record<string, unknown>;
  if (citizen) {
    if (!isId(body.disease_id)) {
      return NextResponse.json({ error: "Please choose a disease" }, { status: 400 });
    }
    const { data: disease, error: dErr } = await supabaseAdmin()
      .from("diseases")
      .select("id")
      .eq("id", body.disease_id)
      .eq("citizen_selectable", true)
      .maybeSingle();
    if (dErr) {
      console.error("[api/report] disease lookup failed", dErr);
      return NextResponse.json({ error: "Could not save report" }, { status: 500 });
    }
    if (!disease) return NextResponse.json({ error: "Unknown disease" }, { status: 400 });
    row = { ward_id: user.ward_id, panchayat_id: user.panchayat_id, disease_id: disease.id };
  } else {
    if (!isValidWard(body.ward)) {
      return NextResponse.json({ error: "Please choose a ward (1-10)" }, { status: 400 });
    }
    row = { ward: body.ward };
  }

  const last = decodeReportCookie(cookies().get(REPORT_COOKIE)?.value);
  const elapsed = last ? Date.now() - last : Infinity;
  if (elapsed < REPORT_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "Already reported recently", retryAfterMs: REPORT_COOLDOWN_MS - elapsed },
      { status: 429 },
    );
  }

  try {
    const { error } = await supabaseAdmin().from("reports").insert(row);
    if (error) throw error;
  } catch (err) {
    console.error("[api/report] insert failed", err);
    return NextResponse.json({ error: "Could not save report" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(REPORT_COOKIE, encodeReportCookie(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.ceil(REPORT_COOLDOWN_MS / 1000),
    path: "/",
  });
  return res;
}
