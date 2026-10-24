import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fail, readJson } from "@/lib/http";
import { apiError } from "@/lib/i18n/api";
import { getLang } from "@/lib/i18n/server";
import { USERNAME_RE, cleanName, isId, isValidName, isValidPassword, normalizeUsername } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ASHA: register an elder citizen in her own panchayat. Approved immediately. */
export async function POST(req: Request) {
  const g = await requireScoped(["asha"]);
  if (g.error) return g.error;

  const r = await readJson(req);
  if (r.error) return r.error;

  const displayName = cleanName(r.body.display_name);
  const username = normalizeUsername(r.body.username);
  if (!isValidName(displayName)) return apiError("err_name");
  if (!USERNAME_RE.test(username)) return apiError("err_username");
  if (!isValidPassword(r.body.password)) return apiError("err_password");
  if (!isId(r.body.ward_id)) return apiError("choose_ward_err");

  const currentYear = new Date().getFullYear();
  let birthYear: number | null = null;
  if (r.body.birth_year !== undefined && r.body.birth_year !== null && r.body.birth_year !== "") {
    const by = Number(r.body.birth_year);
    if (!Number.isInteger(by) || by < 1900 || by > currentYear) {
      return apiError("err_birth_year");
    }
    birthYear = by;
  }

  const livesAlone = Boolean(r.body.lives_alone);
  let familyPhone: string | null = null;
  if (typeof r.body.family_phone === "string" && r.body.family_phone.trim()) {
    const cleaned = r.body.family_phone.trim();
    if (!/^[0-9]{10}$/.test(cleaned)) {
      return apiError("err_family_phone");
    }
    familyPhone = cleaned;
  }

  const db = supabaseAdmin();

  try {
    // Ward must belong to ASHA's panchayat
    const { data: ward, error: wardErr } = await db
      .from("wards")
      .select("id, panchayat_id")
      .eq("id", r.body.ward_id)
      .eq("panchayat_id", g.user.panchayat_id)
      .maybeSingle();
    if (wardErr) throw wardErr;
    if (!ward) return apiError("choose_ward_err");

    const hash = await bcrypt.hash(r.body.password as string, 10);
    const { error } = await db.from("profiles").insert({
      username,
      password_hash: hash,
      display_name: displayName,
      role: "citizen",
      district_id: g.user.district_id,
      panchayat_id: g.user.panchayat_id,
      ward_id: ward.id,
      birth_year: birthYear,
      lives_alone: livesAlone,
      family_phone: familyPhone,
      is_elder: true,
      large_text: true,
      approved: true,
      lang: getLang(),
    });

    if (error) {
      if (error.code === "23505") return apiError("err_username_taken", 409);
      throw error;
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return fail("api/asha/elders", err);
  }
}
