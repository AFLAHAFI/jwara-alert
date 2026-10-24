import { NextResponse } from "next/server";
import { apiError } from "@/lib/i18n/api";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidWard, REPORT_COOKIE, REPORT_COOLDOWN_MS } from "@/lib/constants";
import { decodeReportCookie, encodeReportCookie } from "@/lib/reportCookie";
import { getCurrentUser } from "@/lib/authz";
import { isId } from "@/lib/validation";
import { getT } from "@/lib/i18n/server";

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
    return apiError("err_invalid");
  }
  if (!body || typeof body !== "object") {
    return apiError("err_invalid");
  }

  // Logged-in citizen: ward and panchayat come from the account, never from the request.
  // The report row still stores no user id, so it stays anonymous.
  const user = await getCurrentUser();
  const citizen = user && user.role === "citizen" && user.approved && user.ward_id && user.panchayat_id;
  let row: Record<string, unknown>;
  if (citizen) {
    if (!isId(body.disease_id)) {
      return apiError("err_disease");
    }
    const { data: disease, error: dErr } = await supabaseAdmin()
      .from("diseases")
      .select("id")
      .eq("id", body.disease_id)
      .eq("citizen_selectable", true)
      .maybeSingle();
    if (dErr) {
      console.error("[api/report] disease lookup failed", dErr);
      return apiError("report_fail", 500);
    }
    if (!disease) return apiError("err_disease");
    row = { ward_id: user.ward_id, panchayat_id: user.panchayat_id, disease_id: disease.id };
  } else {
    if (!isValidWard(body.ward)) {
      return apiError("choose_ward_err");
    }
    row = { ward: body.ward };
  }

  const last = decodeReportCookie(cookies().get(REPORT_COOKIE)?.value);
  const elapsed = last ? Date.now() - last : Infinity;
  if (elapsed < REPORT_COOLDOWN_MS) {
    return NextResponse.json(
      { error: getT().t.err_already_reported, retryAfterMs: REPORT_COOLDOWN_MS - elapsed },
      { status: 429 },
    );
  }

  // Per-account limit for logged-in residents: survives logout, cleared cookies and a new phone.
  // Claimed with one conditional UPDATE, so two quick taps cannot both pass. The report row
  // itself still stores no user id; only the time of the account's last report is kept.
  let claimedFrom: string | null | undefined;
  if (citizen) {
    const db = supabaseAdmin();
    const now = new Date();
    const cutoff = new Date(now.getTime() - REPORT_COOLDOWN_MS).toISOString();
    try {
      const { data: prev, error: pErr } = await db.from("profiles").select("last_report_at").eq("id", user.id).single();
      if (pErr) throw pErr;
      const { data: claimed, error: cErr } = await db
        .from("profiles")
        .update({ last_report_at: now.toISOString() })
        .eq("id", user.id)
        .or(`last_report_at.is.null,last_report_at.lt."${cutoff}"`)
        .select("id");
      if (cErr) throw cErr;
      if (!claimed?.length) {
        const lastMs = prev?.last_report_at ? new Date(prev.last_report_at).getTime() : now.getTime();
        const retryAfterMs = Math.max(60_000, Math.min(REPORT_COOLDOWN_MS, lastMs + REPORT_COOLDOWN_MS - now.getTime()));
        return NextResponse.json({ error: getT().t.err_already_reported, retryAfterMs }, { status: 429 });
      }
      claimedFrom = prev?.last_report_at ?? null;
    } catch (err) {
      console.error("[api/report] account limit failed", err);
      return apiError("report_fail", 500);
    }
  }

  try {
    const { error } = await supabaseAdmin().from("reports").insert(row);
    if (error) throw error;
  } catch (err) {
    console.error("[api/report] insert failed", err);
    // Give the account its report back if the insert did not happen.
    if (citizen && claimedFrom !== undefined) {
      await supabaseAdmin().from("profiles").update({ last_report_at: claimedFrom }).eq("id", user.id);
    }
    return apiError("report_fail", 500);
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
