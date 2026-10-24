import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * State admin: approve or reject a PENDING officer. Both are conditional on
 * approved = false, so a double tap or a stale screen cannot undo a decision.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["state_admin"]);
  if (guard.error) return guard.error;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: { action?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const action = body?.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  try {
    const db = supabaseAdmin();
    const query =
      action === "approve"
        ? db.from("profiles").update({ approved: true })
        : db.from("profiles").delete();
    const { data, error } = await query
      .eq("id", params.id)
      .eq("role", "panchayat_officer")
      .eq("approved", false)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Officer is not pending" }, { status: 409 });
    }
    return NextResponse.json({ ok: true, action });
  } catch (err) {
    console.error("[api/admin/officers/:id] failed", err);
    return NextResponse.json({ error: "Could not update officer" }, { status: 500 });
  }
}
