import { NextResponse } from "next/server";
import { apiError } from "@/lib/i18n/api";
import { requireRole } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** State admin: officer accounts. ?status=pending (default) | approved | all */
export async function GET(req: Request) {
  const guard = await requireRole(["state_admin"]);
  if (guard.error) return guard.error;

  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  try {
    let q = supabaseAdmin()
      .from("profiles")
      .select(
        "id, username, display_name, designation, approved, created_at, districts(name_en, name_ml, name_hi), panchayats(name_en, name_ml, name_hi)",
      )
      .eq("role", "panchayat_officer")
      .order("created_at", { ascending: false })
      .limit(200);
    if (status === "pending") q = q.eq("approved", false);
    else if (status === "approved") q = q.eq("approved", true);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ officers: data ?? [] });
  } catch (err) {
    console.error("[api/admin/officers] list failed", err);
    return apiError("loadError", 500);
  }
}
