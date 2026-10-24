import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { MAX_ALERT_BODY } from "@/lib/alertTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: edit the Malayalam text of a draft. Published alerts are immutable. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: { body_ml?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const text = body && typeof body === "object" ? body.body_ml : undefined;
  if (typeof text !== "string" || !text.trim() || text.length > MAX_ALERT_BODY) {
    return NextResponse.json({ error: "Alert text is empty or too long" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("alerts")
      .update({ body_ml: text.trim() })
      .eq("id", params.id)
      .eq("status", "draft")
      .select("id, ward, body_ml, status, created_at, published_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    return NextResponse.json({ alert: data });
  } catch (err) {
    console.error("[api/alerts/:id] update failed", err);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}
