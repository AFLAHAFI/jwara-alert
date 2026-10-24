import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fail } from "@/lib/http";
import { getKolkataToday } from "@/lib/elder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Citizen: Daily "I am OK" check-in (Asia/Kolkata day). Idempotent. */
export async function POST() {
  const g = await requireRole(["citizen"]);
  if (g.error) return g.error;

  const day = getKolkataToday();
  const db = supabaseAdmin();

  try {
    // Check if already checked in today
    const { data: existing, error: checkErr } = await db
      .from("checkins")
      .select("id, created_at")
      .eq("user_id", g.user.id)
      .eq("day", day)
      .maybeSingle();
    if (checkErr) throw checkErr;

    if (existing) {
      return NextResponse.json({ ok: true, day, created_at: existing.created_at });
    }

    const { data, error } = await db
      .from("checkins")
      .insert({ user_id: g.user.id, day })
      .select("id, created_at")
      .single();

    if (error) {
      // 23505: unique constraint violation (duplicate key on user_id, day)
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, day });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, day, created_at: data.created_at });
  } catch (err) {
    return fail("api/checkin", err);
  }
}
