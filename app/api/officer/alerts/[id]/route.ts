import { NextResponse } from "next/server";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { MAX_ALERT_BODY } from "@/lib/alertTemplate";
import { bad, fail, readJson, UUID_RE } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** Officer: edit the text of one of their panchayat's drafts. */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  if (!UUID_RE.test(params.id)) return bad("Invalid id");
  const r = await readJson(req);
  if (r.error) return r.error;
  const text = r.body.body_ml;
  if (typeof text !== "string" || !text.trim() || text.length > MAX_ALERT_BODY) {
    return bad("Alert text is empty or too long");
  }
  try {
    const { data, error } = await supabaseAdmin()
      .from("alerts")
      .update({ body_ml: text.trim() })
      .eq("id", params.id)
      .eq("panchayat_id", g.user.panchayat_id)
      .eq("status", "draft")
      .select("id");
    if (error) throw error;
    if (!data?.length) return bad("Draft not found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail("api/officer/alerts/:id PATCH", err, "Could not save");
  }
}

/** Officer: discard a draft. Published alerts cannot be deleted. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  if (!UUID_RE.test(params.id)) return bad("Invalid id");
  try {
    const { data, error } = await supabaseAdmin()
      .from("alerts")
      .delete()
      .eq("id", params.id)
      .eq("panchayat_id", g.user.panchayat_id)
      .eq("status", "draft")
      .select("id");
    if (error) throw error;
    if (!data?.length) return bad("Draft not found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail("api/officer/alerts/:id DELETE", err, "Could not delete");
  }
}
