import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidWard } from "@/lib/constants";
import { buildAlertBody } from "@/lib/alertTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: create a draft alert for a ward from the fixed template. */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: { ward?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !isValidWard(body.ward)) {
    return NextResponse.json({ error: "Ward must be 1-10" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("alerts")
      .insert({ ward: body.ward, body_ml: buildAlertBody(body.ward), status: "draft" })
      .select("id, ward, status, body_ml, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ alert: data }, { status: 201 });
  } catch (err) {
    console.error("[api/alerts] create failed", err);
    return NextResponse.json({ error: "Could not create alert" }, { status: 500 });
  }
}
