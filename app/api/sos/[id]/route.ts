import { NextResponse } from "next/server";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fail, readJson, UUID_RE } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ASHA or Officer: Accept or Resolve an SOS in their own panchayat. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await requireScoped(["asha", "panchayat_officer"]);
  if (g.error) return g.error;

  if (!UUID_RE.test(params.id)) {
    return apiError("err_invalid");
  }

  const r = await readJson(req);
  if (r.error) return r.error;

  const action = r.body.action;
  if (action !== "accept" && action !== "resolve") {
    return apiError("err_invalid");
  }

  const db = supabaseAdmin();
  const now = new Date().toISOString();

  try {
    // First, verify the SOS belongs to the user's panchayat
    const { data: current, error: fetchErr } = await db
      .from("sos_requests")
      .select("id, panchayat_id, status")
      .eq("id", params.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    if (!current || current.panchayat_id !== g.user.panchayat_id) {
      return apiError("err_not_allowed", 403);
    }

    if (action === "accept") {
      if (current.status !== "open") {
        return NextResponse.json({ ok: true, status: current.status });
      }

      const { data, error } = await db
        .from("sos_requests")
        .update({
          status: "accepted",
          accepted_by: g.user.id,
          accepted_at: now,
        })
        .eq("id", params.id)
        .eq("panchayat_id", g.user.panchayat_id)
        .eq("status", "open")
        .select("id, status, accepted_at")
        .maybeSingle();
      if (error) throw error;

      return NextResponse.json({ ok: true, sos: data ?? current });
    } else {
      // action === "resolve"
      if (current.status === "resolved") {
        return NextResponse.json({ ok: true, status: "resolved" });
      }

      const { data, error } = await db
        .from("sos_requests")
        .update({
          status: "resolved",
          resolved_at: now,
        })
        .eq("id", params.id)
        .eq("panchayat_id", g.user.panchayat_id)
        .in("status", ["open", "accepted"])
        .select("id, status, resolved_at")
        .maybeSingle();
      if (error) throw error;

      return NextResponse.json({ ok: true, sos: data ?? current });
    }
  } catch (err) {
    return fail("api/sos/[id]", err);
  }
}
