import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireScoped } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { bad, fail, readJson } from "@/lib/http";
import { USERNAME_RE, cleanName, isValidName, isValidPassword, normalizeUsername } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Officer: create an ASHA account in their own panchayat. Approved at once (officer vouches). */
export async function POST(req: Request) {
  const g = await requireScoped(["panchayat_officer"]);
  if (g.error) return g.error;
  const r = await readJson(req);
  if (r.error) return r.error;

  const displayName = cleanName(r.body.display_name);
  const username = normalizeUsername(r.body.username);
  if (!isValidName(displayName)) return bad("Enter the ASHA worker's name");
  if (!USERNAME_RE.test(username)) return bad("Username: 3-30 letters, numbers, dot or underscore");
  if (!isValidPassword(r.body.password)) return bad("Password must be 6-72 characters");

  try {
    const hash = await bcrypt.hash(r.body.password, 10);
    const { error } = await supabaseAdmin().from("profiles").insert({
      username,
      password_hash: hash,
      display_name: displayName,
      role: "asha",
      district_id: g.user.district_id,
      panchayat_id: g.user.panchayat_id,
      approved: true,
    });
    if (error) {
      if (error.code === "23505") return bad("Username is already taken", 409);
      throw error;
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return fail("api/officer/ashas", err, "Could not create account");
  }
}
