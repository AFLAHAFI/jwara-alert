import { NextResponse } from "next/server";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fail, readJson, UUID_RE } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Officer: switch an ASHA account in their panchayat off or back on. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  if (!UUID_RE.test(params.id)) return apiError("err_invalid");
  const r = await readJson(req);
  if (r.error) return r.error;
  if (typeof r.body.disabled !== "boolean") return apiError("err_invalid");
  try {
    const { data, error } = await supabaseAdmin()
      .from("profiles")
      .update({ disabled: r.body.disabled })
      .eq("id", params.id)
      .eq("role", "asha")
      .eq("panchayat_id", g.user.panchayat_id)
      .select("id");
    if (error) throw error;
    if (!data?.length) return apiError("err_not_found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail("api/officer/ashas/:id", err);
  }
}
