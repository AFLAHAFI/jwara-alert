import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { WARDS } from "@/lib/constants";
import { isRedWard, windowStart, type WardCount } from "@/lib/redLogic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE = 1000;

/** PostgREST caps rows per response; page until a short page so counts cover the full window. */
async function fetchReportWards(sinceIso: string): Promise<number[]> {
  const wards: number[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin()
      .from("reports")
      .select("ward")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const row of data ?? []) wards.push(row.ward);
    if (!data || data.length < PAGE) return wards;
  }
}

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const since = windowStart();
  try {
    const reportWards = await fetchReportWards(since.toISOString());

    const counts = new Map<number, number>(WARDS.map((w) => [w, 0]));
    for (const ward of reportWards) counts.set(ward, (counts.get(ward) ?? 0) + 1);
    const wards: WardCount[] = WARDS.map((ward) => ({ ward, count: counts.get(ward) ?? 0 }));

    const { data: drafts, error: draftErr } = await supabaseAdmin()
      .from("alerts")
      .select("id, ward, status")
      .eq("status", "draft");
    if (draftErr) throw draftErr;

    return NextResponse.json({
      since: since.toISOString(),
      wards,
      redWards: wards.filter((w) => isRedWard(w.count)).map((w) => w.ward),
      openDrafts: drafts ?? [],
    });
  } catch (err) {
    console.error("[api/dashboard] failed", err);
    return NextResponse.json({ error: "Could not load dashboard" }, { status: 500 });
  }
}
