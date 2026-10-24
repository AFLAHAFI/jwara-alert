import { NextResponse } from "next/server";
import { isValidAdminPin, requireAdmin, ADMIN_PIN_HEADER } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidWard } from "@/lib/constants";
import { buildAlertBody } from "@/lib/alertTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = "id, ward, body_ml, status, created_at, published_at";

/** Public: published alerts newest first. With a valid admin PIN, drafts are included. */
export async function GET(req: Request) {
  const admin = isValidAdminPin(req.headers.get(ADMIN_PIN_HEADER));
  try {
    let q = supabaseAdmin().from("alerts").select(COLUMNS).is("panchayat_id", null);
    if (!admin) q = q.eq("status", "published");
    const { data, error } = await q.order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return NextResponse.json({ alerts: data ?? [], admin });
  } catch (err) {
    console.error("[api/alerts] list failed", err);
    return NextResponse.json({ error: "Could not load alerts" }, { status: 500 });
  }
}

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
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return NextResponse.json({ alert: data }, { status: 201 });
  } catch (err) {
    console.error("[api/alerts] create failed", err);
    return NextResponse.json({ error: "Could not create alert" }, { status: 500 });
  }
}
