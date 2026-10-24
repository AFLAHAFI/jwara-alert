import { NextResponse } from "next/server";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseBodies } from "@/lib/alertBodies";
import { fail, readJson, UUID_RE } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** Officer: edit the texts of one of their panchayat's drafts. */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  if (!UUID_RE.test(params.id)) return apiError("err_invalid");
  const r = await readJson(req);
  if (r.error) return r.error;
  const bodies = parseBodies(r.body.bodies);
  if (!bodies) return apiError("err_alert_text");
  try {
    const { data, error } = await supabaseAdmin()
      .from("alerts")
      .update(bodies)
      .eq("id", params.id)
      .eq("panchayat_id", g.user.panchayat_id)
      .eq("status", "draft")
      .select("id");
    if (error) throw error;
    if (!data?.length) return apiError("err_not_found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail("api/officer/alerts/:id PATCH", err);
  }
}

/** Officer: discard a draft. Published alerts cannot be deleted. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  if (!UUID_RE.test(params.id)) return apiError("err_invalid");
  try {
    const { data, error } = await supabaseAdmin()
      .from("alerts")
      .delete()
      .eq("id", params.id)
      .eq("panchayat_id", g.user.panchayat_id)
      .eq("status", "draft")
      .select("id");
    if (error) throw error;
    if (!data?.length) return apiError("err_not_found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail("api/officer/alerts/:id DELETE", err);
  }
}
