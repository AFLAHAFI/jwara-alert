import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fail } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Citizen: Trigger SOS alert. Idempotent within 15 minutes. */
export async function POST(req: Request) {
  const g = await requireRole(["citizen"]);
  if (g.error) return g.error;

  if (!g.user.panchayat_id) {
    return apiError("err_not_allowed", 403);
  }

  let lat: number | null = null;
  let lng: number | null = null;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof body.lat === "number" && typeof body.lng === "number") {
      if (body.lat >= -90 && body.lat <= 90 && body.lng >= -180 && body.lng <= 180) {
        lat = body.lat;
        lng = body.lng;
      }
    }
  } catch {}

  const db = supabaseAdmin();
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  try {
    // Idempotent: return existing active SOS from last 15 minutes
    const { data: existing, error: existErr } = await db
      .from("sos_requests")
      .select("id, status, created_at, lat, lng")
      .eq("user_id", g.user.id)
      .in("status", ["open", "accepted"])
      .gte("created_at", fifteenMinsAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existErr) throw existErr;

    if (existing) {
      // The phone sends the SOS first and the location a few seconds later (same request).
      // Attach the location to the active SOS if it has none yet.
      if (lat !== null && lng !== null && existing.lat === null) {
        const { data: located } = await db
          .from("sos_requests")
          .update({ lat, lng })
          .eq("id", existing.id)
          .is("lat", null)
          .select("id, status, created_at, lat, lng")
          .maybeSingle();
        if (located) return NextResponse.json({ ok: true, sos: located, existing: true }, { status: 200 });
      }
      return NextResponse.json({ ok: true, sos: existing, existing: true }, { status: 200 });
    }

    const { data, error } = await db
      .from("sos_requests")
      .insert({
        user_id: g.user.id,
        panchayat_id: g.user.panchayat_id,
        ward_id: g.user.ward_id,
        lat,
        lng,
        status: "open",
      })
      .select("id, status, created_at, lat, lng")
      .single();
    if (error) {
      // Two taps at the same moment: the unique index (one active SOS per user) stops the second.
      // Return the SOS that is already active instead of an error.
      if (error.code === "23505") {
        const { data: active, error: aErr } = await db
          .from("sos_requests")
          .select("id, status, created_at, lat, lng")
          .eq("user_id", g.user.id)
          .in("status", ["open", "accepted"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (aErr) throw aErr;
        if (active) return NextResponse.json({ ok: true, sos: active, existing: true }, { status: 200 });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, sos: data }, { status: 201 });
  } catch (err) {
    return fail("api/sos", err);
  }
}
