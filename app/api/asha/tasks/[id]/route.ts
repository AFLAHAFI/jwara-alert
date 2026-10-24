import { NextResponse } from "next/server";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fail, readJson, UUID_RE } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function count(v: unknown): number | null | false {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 1000) return false;
  return v;
}

/**
 * ASHA: mark one of THEIR OWN tasks done / not done.
 * When marking done, the visit report (homes visited, people with fever, referred, note) can be saved too.
 * Marking "not done" keeps the last report, so nothing she typed is lost.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await requireScoped(["asha"]);
  if (g.error) return g.error;
  if (!UUID_RE.test(params.id)) return apiError("err_invalid");
  const r = await readJson(req);
  if (r.error) return r.error;
  const { done, visit } = r.body;
  if (typeof done !== "boolean") return apiError("err_invalid");

  const patch: Record<string, unknown> = { done, done_at: done ? new Date().toISOString() : null };
  if (done && visit !== undefined) {
    if (!visit || typeof visit !== "object" || Array.isArray(visit)) return apiError("err_visit_numbers");
    const v = visit as Record<string, unknown>;
    const homes = count(v.homes);
    const fever = count(v.fever);
    const referred = count(v.referred);
    const note = typeof v.note === "string" ? v.note.trim() : v.note == null ? "" : false;
    if (homes === false || fever === false || referred === false || note === false || note.length > 500) {
      return apiError("err_visit_numbers");
    }
    Object.assign(patch, {
      visit_homes: homes,
      visit_fever: fever,
      visit_referred: referred,
      visit_note: note || null,
    });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("tasks")
      .update(patch)
      .eq("id", params.id)
      .eq("assigned_to", g.user.id)
      .select("id");
    if (error) throw error;
    if (!data?.length) return apiError("err_not_found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail("api/asha/tasks/:id", err);
  }
}
