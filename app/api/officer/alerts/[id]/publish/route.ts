import { NextResponse } from "next/server";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseBodies } from "@/lib/alertBodies";
import { fail, UUID_RE } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Officer approves + publishes a draft (optionally saving final texts in the same step).
 * Guarded by status = 'draft' so a double tap cannot publish twice.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  if (!UUID_RE.test(params.id)) return apiError("err_invalid");

  const body = (await req.json().catch(() => ({}))) as { bodies?: unknown } | null;
  let bodies = null;
  if (body && typeof body === "object" && body.bodies !== undefined) {
    bodies = parseBodies(body.bodies);
    if (!bodies) return apiError("err_alert_text");
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("alerts")
      .update({ status: "published", published_at: new Date().toISOString(), ...(bodies ?? {}) })
      .eq("id", params.id)
      .eq("panchayat_id", g.user.panchayat_id)
      .eq("status", "draft")
      .select("id");
    if (error) throw error;
    if (!data?.length) return apiError("err_already_published", 409);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail("api/officer/alerts/:id/publish", err);
  }
}
