import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { WARDS } from "@/lib/constants";
import { isRedWard, windowStart, type WardCount } from "@/lib/redLogic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const since = windowStart();
  try {
    const { data, error } = await supabaseAdmin()
      .from("reports")
      .select("ward")
      .gte("created_at", since.toISOString());
    if (error) throw error;

    const counts = new Map<number, number>(WARDS.map((w) => [w, 0]));
    for (const row of data ?? []) counts.set(row.ward, (counts.get(row.ward) ?? 0) + 1);
    const wards: WardCount[] = WARDS.map((ward) => ({ ward, count: counts.get(ward) ?? 0 }));

    const { data: drafts, error: draftErr } = await supabaseAdmin()
      .from("alerts")
      .select("id, ward, status")
      .gte("created_at", since.toISOString());
    if (draftErr) throw draftErr;

    return NextResponse.json({
      since: since.toISOString(),
      wards,
      redWards: wards.filter((w) => isRedWard(w.count)).map((w) => w.ward),
      recentAlerts: drafts ?? [],
    });
  } catch (err) {
    console.error("[api/dashboard] failed", err);
    return NextResponse.json({ error: "Could not load dashboard" }, { status: 500 });
  }
}
