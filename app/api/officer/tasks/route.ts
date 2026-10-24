import { NextResponse } from "next/server";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fail, readJson, UUID_RE } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";
import { cleanName, isId } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True only for a real calendar day (rejects 2026-02-31, which Date.parse accepts). */
function isRealDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Officer: assign a follow-up visit for a PUBLISHED alert to an ASHA.
 * Alert, ward and ASHA must all belong to the officer's panchayat; the ASHA must be active.
 */
export async function POST(req: Request) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  const pid = g.user.panchayat_id;
  const r = await readJson(req);
  if (r.error) return r.error;
  const { alert_id, ward_id, assigned_to, title, due_date } = r.body;

  if (typeof alert_id !== "string" || !UUID_RE.test(alert_id)) return apiError("err_invalid");
  if (!isId(ward_id)) return apiError("err_pick_ward");
  if (typeof assigned_to !== "string" || !UUID_RE.test(assigned_to)) return apiError("err_asha_scope");
  const cleanTitle = cleanName(title);
  if (!cleanTitle || cleanTitle.length > 160) return apiError("err_task_title");
  let due: string | null = null;
  if (due_date !== undefined && due_date !== null && due_date !== "") {
    if (typeof due_date !== "string" || !isRealDate(due_date)) {
      return apiError("err_due");
    }
    due = due_date;
  }

  const db = supabaseAdmin();
  try {
    const [alertRes, wardRes, ashaRes] = await Promise.all([
      db.from("alerts").select("id, status").eq("id", alert_id).eq("panchayat_id", pid).maybeSingle(),
      db.from("wards").select("id, number").eq("id", ward_id).eq("panchayat_id", pid).maybeSingle(),
      db
        .from("profiles")
        .select("id")
        .eq("id", assigned_to)
        .eq("role", "asha")
        .eq("panchayat_id", pid)
        .eq("disabled", false)
        .maybeSingle(),
    ]);
    if (alertRes.error) throw alertRes.error;
    if (wardRes.error) throw wardRes.error;
    if (ashaRes.error) throw ashaRes.error;
    if (!alertRes.data) return apiError("err_not_found", 404);
    if (alertRes.data.status !== "published") return apiError("err_publish_first", 409);
    if (!wardRes.data) return apiError("err_ward_scope", 403);
    if (!ashaRes.data) return apiError("err_asha_scope", 403);

    const { error } = await db.from("tasks").insert({
      alert_id,
      panchayat_id: pid,
      ward_id: wardRes.data.id,
      assigned_to: ashaRes.data.id,
      title: cleanTitle,
      due_date: due,
      created_by: g.user.id,
    });
    if (error) {
      // Unique (alert, ward, ASHA): a retry or a second tab cannot create the same visit twice.
      if (error.code === "23505") return apiError("err_task_duplicate", 409);
      throw error;
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return fail("api/officer/tasks", err);
  }
}
