import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fail, readJson, UUID_RE } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * State admin actions on an officer account:
 * - approve / reject: only while the officer is PENDING (conditional, so a stale screen cannot undo a decision)
 * - disable / enable: only for APPROVED officers (switch the account off or back on; nothing is deleted)
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["state_admin"]);
  if (guard.error) return guard.error;
  if (!UUID_RE.test(params.id)) return apiError("err_invalid");
  const r = await readJson(req);
  if (r.error) return r.error;
  const action = r.body.action;
  if (action !== "approve" && action !== "reject" && action !== "disable" && action !== "enable") {
    return apiError("err_invalid");
  }

  try {
    const db = supabaseAdmin();
    const base =
      action === "approve"
        ? db.from("profiles").update({ approved: true })
        : action === "reject"
          ? db.from("profiles").delete()
          : db.from("profiles").update({ disabled: action === "disable" });
    const { data, error } = await base
      .eq("id", params.id)
      .eq("role", "panchayat_officer")
      .eq("approved", action === "approve" || action === "reject" ? false : true)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) return apiError("err_officer_pending", 409);
    return NextResponse.json({ ok: true, action });
  } catch (err) {
    return fail("api/admin/officers/:id", err);
  }
}
