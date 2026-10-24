import { NextResponse } from "next/server";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { MAX_ALERT_BODY } from "@/lib/alertTemplate";
import { bad, fail, UUID_RE } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Officer approves + publishes a draft (optionally saving final text in the same step).
 * Guarded by status = 'draft' so a double tap cannot publish twice.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  if (!UUID_RE.test(params.id)) return bad("Invalid id");

  const body = (await req.json().catch(() => ({}))) as { body_ml?: unknown } | null;
  let text: string | undefined;
  if (body && typeof body === "object" && body.body_ml !== undefined) {
    if (typeof body.body_ml !== "string" || !body.body_ml.trim() || body.body_ml.length > MAX_ALERT_BODY) {
      return bad("Alert text is empty or too long");
    }
    text = body.body_ml.trim();
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("alerts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        ...(text !== undefined ? { body_ml: text } : {}),
      })
      .eq("id", params.id)
      .eq("panchayat_id", g.user.panchayat_id)
      .eq("status", "draft")
      .select("id");
    if (error) throw error;
    if (!data?.length) return bad("Draft not found or already published", 409);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail("api/officer/alerts/:id/publish", err, "Could not publish");
  }
}
