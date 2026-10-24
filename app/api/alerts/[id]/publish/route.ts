import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { MAX_ALERT_BODY, taskTitleForWard } from "@/lib/alertTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin: approve + publish a draft. Optionally saves final text in the same step.
 * Publishing creates exactly one follow-up task ("Visit Ward N houses") for the ward.
 * The draft->published transition is guarded by `.eq("status", "draft")`, so a
 * double-tap or retry cannot publish twice or create a second task.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let text: string | undefined;
  try {
    const body = (await req.json().catch(() => ({}))) as { body_ml?: unknown } | null;
    if (body && typeof body === "object" && body.body_ml !== undefined) {
      if (typeof body.body_ml !== "string" || !body.body_ml.trim() || body.body_ml.length > MAX_ALERT_BODY) {
        return NextResponse.json({ error: "Alert text is empty or too long" }, { status: 400 });
      }
      text = body.body_ml.trim();
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const db = supabaseAdmin();
  try {
    const { data: alert, error } = await db
      .from("alerts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        ...(text !== undefined ? { body_ml: text } : {}),
      })
      .eq("id", params.id)
      .eq("status", "draft")
      .select("id, ward, body_ml, status, created_at, published_at")
      .maybeSingle();
    if (error) throw error;
    if (!alert) {
      return NextResponse.json({ error: "Draft not found or already published" }, { status: 409 });
    }

    const { data: existing } = await db
      .from("tasks")
      .select("id")
      .eq("alert_id", alert.id)
      .limit(1);
    if (!existing || existing.length === 0) {
      const { error: taskErr } = await db
        .from("tasks")
        .insert({ alert_id: alert.id, ward: alert.ward, title: taskTitleForWard(alert.ward) });
      if (taskErr) throw taskErr;
    }

    return NextResponse.json({ alert, taskTitle: taskTitleForWard(alert.ward) });
  } catch (err) {
    console.error("[api/alerts/:id/publish] failed", err);
    return NextResponse.json({ error: "Could not publish" }, { status: 500 });
  }
}
