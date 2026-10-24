import { NextResponse } from "next/server";
import { requireScoped } from "@/lib/authz";
import { fail, readJson } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { FACILITY_KINDS, type FacilityKind } from "@/lib/wardStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PER_PANCHAYAT = 50;
const PHONE_RE = /^[0-9+ -]{3,20}$/;

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/\s+/g, " ").trim();
  return s && s.length <= max ? s : null;
}

/** Officer: add a hospital or health centre to their own panchayat. */
export async function POST(req: Request) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  const r = await readJson(req);
  if (r.error) return r.error;

  const name = text(r.body.name, 100);
  if (!name || name.length < 2) return apiError("fac_err_name");
  const kind = r.body.kind as FacilityKind;
  if (!FACILITY_KINDS.includes(kind)) return apiError("err_invalid");
  let phone: string | null = null;
  if (r.body.phone !== undefined && r.body.phone !== null && r.body.phone !== "") {
    phone = text(r.body.phone, 20);
    if (!phone || !PHONE_RE.test(phone) || phone.replace(/\D/g, "").length < 3) return apiError("fac_err_phone");
  }
  let address: string | null = null;
  if (r.body.address !== undefined && r.body.address !== null && r.body.address !== "") {
    address = text(r.body.address, 200);
    if (!address) return apiError("fac_err_address");
  }
  const open24 = r.body.open_24h === true;

  try {
    const db = supabaseAdmin();
    const { count, error: cErr } = await db
      .from("health_facilities")
      .select("id", { count: "exact", head: true })
      .eq("panchayat_id", g.user.panchayat_id);
    if (cErr) throw cErr;
    if ((count ?? 0) >= MAX_PER_PANCHAYAT) return apiError("fac_err_full", 409);

    const { data, error } = await db
      .from("health_facilities")
      .insert({ panchayat_id: g.user.panchayat_id, name, kind, phone, address, open_24h: open24, created_by: g.user.id })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") return apiError("fac_err_dup", 409);
      throw error;
    }
    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (err) {
    return fail("api/officer/facilities POST", err);
  }
}

/** Officer: remove one entry of their own panchayat (?id=). */
export async function DELETE(req: Request) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  const raw = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^\d{1,15}$/.test(raw)) return apiError("err_invalid");
  try {
    const { data, error } = await supabaseAdmin()
      .from("health_facilities")
      .delete()
      .eq("id", Number(raw))
      .eq("panchayat_id", g.user.panchayat_id)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) return apiError("err_not_found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail("api/officer/facilities DELETE", err);
  }
}
