import { NextResponse } from "next/server";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { MAX_ALERT_BODY } from "@/lib/alertTemplate";
import { bad, fail, readJson } from "@/lib/http";
import { isId } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Officer: create a DRAFT alert for their own panchayat.
 * target "all" = whole panchayat; "wards" = only the listed wards (must be in the panchayat).
 */
export async function POST(req: Request) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  const { user } = g;
  const r = await readJson(req);
  if (r.error) return r.error;
  const { disease_id, target, ward_ids, body_ml } = r.body;

  if (!isId(disease_id)) return bad("Choose a disease");
  if (target !== "all" && target !== "wards") return bad("Choose whole panchayat or wards");
  if (typeof body_ml !== "string" || !body_ml.trim() || body_ml.length > MAX_ALERT_BODY) {
    return bad("Alert text is empty or too long");
  }
  let wardIds: number[] = [];
  if (target === "wards") {
    if (!Array.isArray(ward_ids) || ward_ids.length === 0 || ward_ids.length > 40 || !ward_ids.every(isId)) {
      return bad("Choose at least one ward");
    }
    wardIds = Array.from(new Set(ward_ids as number[]));
  }

  const db = supabaseAdmin();
  try {
    const { data: disease, error: dErr } = await db.from("diseases").select("id").eq("id", disease_id).maybeSingle();
    if (dErr) throw dErr;
    if (!disease) return bad("Unknown disease");

    if (wardIds.length) {
      const { data: owned, error: wErr } = await db
        .from("wards")
        .select("id")
        .eq("panchayat_id", user.panchayat_id)
        .in("id", wardIds);
      if (wErr) throw wErr;
      if ((owned ?? []).length !== wardIds.length) return bad("A ward is not in your panchayat", 403);
    }

    const { data: alert, error } = await db
      .from("alerts")
      .insert({
        panchayat_id: user.panchayat_id,
        disease_id: disease.id,
        target,
        body_ml: body_ml.trim(),
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (wardIds.length) {
      const { error: awErr } = await db
        .from("alert_wards")
        .insert(wardIds.map((ward_id) => ({ alert_id: alert.id, ward_id })));
      if (awErr) {
        await db.from("alerts").delete().eq("id", alert.id);
        throw awErr;
      }
    }
    return NextResponse.json({ ok: true, id: alert.id }, { status: 201 });
  } catch (err) {
    return fail("api/officer/alerts", err, "Could not create alert");
  }
}
