import { NextResponse } from "next/server";
import { ADMIN_PIN_HEADER, isValidAdminPin, requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidWard } from "@/lib/constants";
import { buildAlertBody } from "@/lib/alertTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLS = "id, ward, status, body_ml, created_at, published_at";

/** Public: published alerts. With a valid admin PIN header: drafts too. */
export async function GET(req: Request) {
  const isAdmin = isValidAdminPin(req.headers.get(ADMIN_PIN_HEADER));
  try {
    let q = supabaseAdmin().from("alerts").select(COLS).order("created_at", { ascending: false }).limit(50);
    if (!isAdmin) q = q.eq("status", "published");
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ alerts: data ?? [], isAdmin });
  } catch (err) {
    console.error("[api/alerts] list failed", err);
    return NextResponse.json({ error: "Could not load alerts" }, { status: 500 });
  }
}

/** Admin: create a draft alert for a ward from the fixed template (reuses an open draft). */
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
    const { data: existing, error: findErr } = await supabaseAdmin()
      .from("alerts")
      .select(COLS)
      .eq("ward", body.ward)
      .eq("status", "draft")
      .limit(1);
    if (findErr) throw findErr;
    if (existing && existing.length > 0) return NextResponse.json({ alert: existing[0] });

    const { data, error } = await supabaseAdmin()
      .from("alerts")
      .insert({ ward: body.ward, body_ml: buildAlertBody(body.ward), status: "draft" })
      .select(COLS)
      .single();
    if (error) throw error;
    return NextResponse.json({ alert: data }, { status: 201 });
  } catch (err) {
    console.error("[api/alerts] create failed", err);
    return NextResponse.json({ error: "Could not create alert" }, { status: 500 });
  }
}
