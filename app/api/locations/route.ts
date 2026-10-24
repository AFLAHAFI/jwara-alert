import { NextResponse } from "next/server";
import { apiError } from "@/lib/i18n/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: districts, panchayats and wards for the cascading dropdowns. No personal data. */
export async function GET() {
  try {
    const db = supabaseAdmin();
    const [d, p, w] = await Promise.all([
      db.from("districts").select("id, name_en, name_ml, name_hi").order("name_en"),
      db.from("panchayats").select("id, district_id, name_en, name_ml, name_hi").order("name_en"),
      db.from("wards").select("id, panchayat_id, number").order("number"),
    ]);
    if (d.error) throw d.error;
    if (p.error) throw p.error;
    if (w.error) throw w.error;
    return NextResponse.json(
      { districts: d.data, panchayats: p.data, wards: w.data },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    console.error("[api/locations] failed", err);
    return apiError("places_load_err", 500);
  }
}
