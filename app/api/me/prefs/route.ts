import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fail, readJson } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Update user preferences (e.g. large_text). */
export async function POST(req: Request) {
  const g = await requireRole(["citizen", "asha", "panchayat_officer", "state_admin"]);
  if (g.error) return g.error;

  const r = await readJson(req);
  if (r.error) return r.error;

  if (typeof r.body.large_text !== "boolean") {
    return apiError("err_invalid");
  }

  try {
    const { error } = await supabaseAdmin()
      .from("profiles")
      .update({ large_text: r.body.large_text })
      .eq("id", g.user.id);
    if (error) throw error;

    return NextResponse.json({ ok: true, large_text: r.body.large_text });
  } catch (err) {
    return fail("api/me/prefs", err);
  }
}
