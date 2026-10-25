import { NextResponse } from "next/server";
import { apiError } from "@/lib/i18n/api";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createHmac } from "crypto";
import { REPORT_COOKIE, REPORT_COOLDOWN_MS } from "@/lib/constants";
import { clientIp } from "@/lib/clientIp";
import { decodeReportCookie, encodeReportCookie } from "@/lib/reportCookie";
import { getCurrentUser } from "@/lib/authz";
import { isId } from "@/lib/validation";
import { getT } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reports without an account: at most this many per network address per hour (DB-backed). */
const NET_MAX_PER_HOUR = 6;

/** HMAC of the network address: lets us count reports per network without storing the address. */
function netKey(req: Request): string {
  const secret = process.env.SESSION_SECRET ?? "";
  return createHmac("sha256", `net-limit|${secret}`).update(clientIp(req)).digest("base64url").slice(0, 32);
}

async function checkDisease(id: unknown): Promise<number | "bad" | "fail"> {
  if (!isId(id)) return "bad";
  const { data, error } = await supabaseAdmin()
    .from("diseases")
    .select("id")
    .eq("id", id)
    .eq("citizen_selectable", true)
    .maybeSingle();
  if (error) {
    console.error("[api/report] disease lookup failed", error);
    return "fail";
  }
  return data ? data.id : "bad";
}

/**
 * Server-side cooldown: 1 report per 10 minutes per phone.
 * We store nothing about the phone in the database. The check uses an
 * httpOnly cookie holding only the last-report timestamp, HMAC-signed so it
 * cannot be rewound by editing it. A user who clears localStorage still hits
 * the server check. (Clearing cookies resets it; good enough for a pilot.)
 */
export async function POST(req: Request) {
  let body: { ward_id?: unknown; disease_id?: unknown } | null = null;
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
  let place: { ward_number: number; ward_name: string | null; panchayat: Record<string, string | null> } | null = null;
  const disease = await checkDisease(body.disease_id);
  if (disease === "fail") return apiError("report_fail", 500);
  if (disease === "bad") return apiError("err_disease");
  if (citizen) {
    row = { ward_id: user.ward_id, panchayat_id: user.panchayat_id, disease_id: disease };
  } else {
    // No account: the person picks district, panchayat and ward. Only the ward id is taken from
    // the request; its panchayat is looked up here, so a report can never point at a wrong place.
    if (!isId(body.ward_id)) return apiError("choose_ward_err");
    const { data: w, error: wErr } = await supabaseAdmin()
      .from("wards")
      .select("id, number, name, panchayat_id, panchayats(name_en, name_ml, name_hi)")
      .eq("id", body.ward_id)
      .maybeSingle();
    if (wErr) {
      console.error("[api/report] ward lookup failed", wErr);
      return apiError("report_fail", 500);
    }
    if (!w) return apiError("choose_ward_err");
    row = { ward_id: w.id, panchayat_id: w.panchayat_id, disease_id: disease };
    const p = (Array.isArray(w.panchayats) ? w.panchayats[0] : w.panchayats) as Record<string, string | null> | null;
    place = { ward_number: w.number, ward_name: w.name, panchayat: p ?? {} };
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

  // Network limit for reports without an account (clearing cookies does not reset it).
  let netRowId: number | null = null;
  if (!citizen) {
    const db = supabaseAdmin();
    const key = netKey(req);
    try {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error: nErr } = await db
        .from("report_net_limits")
        .select("id", { count: "exact", head: true })
        .eq("net_key", key)
        .gte("at", since);
      if (nErr) throw nErr;
      if ((count ?? 0) >= NET_MAX_PER_HOUR) {
        return NextResponse.json({ error: getT().t.err_already_reported, retryAfterMs: REPORT_COOLDOWN_MS }, { status: 429 });
      }
      const { data: ins, error: iErr } = await db.from("report_net_limits").insert({ net_key: key }).select("id").single();
      if (iErr) throw iErr;
      netRowId = ins.id;
      // Old rows are no longer needed for the limit.
      await db.from("report_net_limits").delete().eq("net_key", key).lt("at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    } catch (err) {
      console.error("[api/report] network limit failed", err);
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
    if (netRowId !== null) await supabaseAdmin().from("report_net_limits").delete().eq("id", netRowId);
    return apiError("report_fail", 500);
  }

  const res = NextResponse.json({ ok: true, place });
  res.cookies.set(REPORT_COOKIE, encodeReportCookie(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.ceil(REPORT_COOLDOWN_MS / 1000),
    path: "/",
  });
  return res;
}
