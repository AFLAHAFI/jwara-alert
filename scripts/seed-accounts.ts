/**
 * Creates FAKE demo accounts (idempotent). Needs the Phase A migration applied first.
 *
 *   DEMO_PASSWORD=choose-one npm run seed:accounts
 *   (or put DEMO_PASSWORD in .env.local)
 *
 * Accounts: admin_kerala, officer_demo (approved), officer_pending (waiting),
 * asha_1, asha_2, citizen_1, citizen_2. All share DEMO_PASSWORD. The password is never printed.
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_PASSWORD;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (run via npm run seed:accounts)");
  process.exit(1);
}
if (!password || password.length < 6) {
  console.error("Set DEMO_PASSWORD (6+ characters) in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: district, error: dErr } = await db
    .from("districts")
    .select("id")
    .eq("name_en", "Ernakulam")
    .single();
  if (dErr || !district) throw new Error("Ernakulam not found. Apply supabase/migrations/001_phase_a.sql first.");
  const { data: panchayat, error: pErr } = await db
    .from("panchayats")
    .select("id")
    .eq("district_id", district.id)
    .order("id")
    .limit(1)
    .single();
  if (pErr || !panchayat) throw new Error("No panchayat found for Ernakulam");
  const { data: wards, error: wErr } = await db
    .from("wards")
    .select("id, number")
    .eq("panchayat_id", panchayat.id)
    .order("number");
  if (wErr || !wards || wards.length < 2) throw new Error("Wards missing");

  const hash = await bcrypt.hash(password!, 10);
  const base = { password_hash: hash };
  const rows = [
    { username: "admin_kerala", display_name: "Kerala Health Dept (demo)", role: "state_admin", approved: true },
    { username: "officer_demo", display_name: "Anil Kumar (demo)", role: "panchayat_officer", approved: true, designation: "Health Inspector", district_id: district.id, panchayat_id: panchayat.id },
    { username: "officer_pending", display_name: "Seema Nair (demo)", role: "panchayat_officer", approved: false, designation: "Junior Health Inspector", district_id: district.id, panchayat_id: panchayat.id },
    { username: "asha_1", display_name: "Lakshmi (demo ASHA)", role: "asha", approved: true, district_id: district.id, panchayat_id: panchayat.id },
    { username: "asha_2", display_name: "Mini (demo ASHA)", role: "asha", approved: true, district_id: district.id, panchayat_id: panchayat.id },
    { username: "citizen_1", display_name: "Rahul (demo)", role: "citizen", approved: true, district_id: district.id, panchayat_id: panchayat.id, ward_id: wards[0].id },
    { username: "citizen_2", display_name: "Fathima (demo)", role: "citizen", approved: true, district_id: district.id, panchayat_id: panchayat.id, ward_id: wards[1].id },
  ].map((r) => ({ ...base, ...r }));

  // ignoreDuplicates: existing usernames are left untouched, so re-running is safe.
  const { error } = await db.from("profiles").upsert(rows, { onConflict: "username", ignoreDuplicates: true });
  if (error) throw error;
  console.log(`Done. ${rows.length} demo accounts ensured. Usernames: ${rows.map((r) => r.username).join(", ")}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
