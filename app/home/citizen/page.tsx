import Link from "next/link";
import Forbidden from "@/components/Forbidden";
import { guardPage } from "@/lib/pageAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function CitizenHome() {
  const user = await guardPage(["citizen"]);
  if (!user) return <Forbidden />;
  let place = "";
  try {
    const { data } = await supabaseAdmin()
      .from("wards")
      .select("number, panchayats(name_en, name_ml, districts(name_en))")
      .eq("id", user.ward_id)
      .maybeSingle();
    const p = data?.panchayats as unknown as
      | { name_en: string; districts: { name_en: string } | { name_en: string }[] | null }
      | null;
    const dist = Array.isArray(p?.districts) ? p?.districts[0] : p?.districts;
    if (data && p) place = `Ward ${data.number}, ${p.name_en}, ${dist?.name_en ?? ""}`;
  } catch {}
  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-bold">
          നമസ്കാരം, {user.display_name}
          <span className="label-en">{place}</span>
        </h1>
      </section>
      <Link href="/report" className="btn-primary flex-col gap-0 py-3 text-center">
        വീട്ടിൽ പനി ഉണ്ടെന്ന് അറിയിക്കുക
        <span className="text-sm font-normal text-teal-100">Report fever</span>
      </Link>
      <Link href="/alerts" className="btn-outline flex-col gap-0 py-3 text-center">
        അറിയിപ്പുകൾ കാണുക
        <span className="text-sm font-normal">View alerts</span>
      </Link>
    </div>
  );
}
