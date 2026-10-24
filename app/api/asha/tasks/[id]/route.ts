import { NextResponse } from "next/server";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fail, readJson, UUID_RE } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ASHA: mark one of THEIR OWN tasks done / not done. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await requireScoped(["asha"]);
  if (g.error) return g.error;
  if (!UUID_RE.test(params.id)) return apiError("err_invalid");
  const r = await readJson(req);
  if (r.error) return r.error;
  if (typeof r.body.done !== "boolean") return apiError("err_invalid");
  try {
    const { data, error } = await supabaseAdmin()
      .from("tasks")
      .update({ done: r.body.done, done_at: r.body.done ? new Date().toISOString() : null })
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
