import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { taskTitleForWard } from "@/lib/alertTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY = 3000;
const COLS = "id, ward, status, body_ml, created_at, published_at";

/**
 * Admin: edit a draft ({ body_ml }) and/or publish it ({ publish: true }).
 * Publishing is a conditional update (only while status = 'draft'), so a double
 * tap can never publish twice or create two tasks.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: { body_ml?: unknown; publish?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const hasText = body.body_ml !== undefined;
  if (hasText && (typeof body.body_ml !== "string" || !body.body_ml.trim() || body.body_ml.length > MAX_BODY)) {
    return NextResponse.json({ error: "Alert text must be 1-3000 characters" }, { status: 400 });
  }
  const publish = body.publish === true;
  if (!hasText && !publish) return NextResponse.json({ error: "Nothing to do" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (hasText) patch.body_ml = (body.body_ml as string).trim();
  if (publish) {
    patch.status = "published";
    patch.published_at = new Date().toISOString();
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("alerts")
      .update(patch)
      .eq("id", params.id)
      .eq("status", "draft")
      .select(COLS);
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Alert is not an open draft" }, { status: 409 });
    }
    const alert = data[0];

    if (publish) {
      const { error: taskErr } = await supabaseAdmin()
        .from("tasks")
        .insert({ alert_id: alert.id, ward: alert.ward, title: taskTitleForWard(alert.ward) });
      if (taskErr) {
        console.error("[api/alerts/:id] task insert failed, reverting publish", taskErr);
        await supabaseAdmin()
          .from("alerts")
          .update({ status: "draft", published_at: null })
          .eq("id", alert.id);
        return NextResponse.json({ error: "Could not publish. Try again." }, { status: 500 });
      }
    }
    return NextResponse.json({ alert });
  } catch (err) {
    console.error("[api/alerts/:id] update failed", err);
    return NextResponse.json({ error: "Could not update alert" }, { status: 500 });
  }
}
