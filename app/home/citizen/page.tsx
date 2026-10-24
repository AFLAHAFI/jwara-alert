import Link from "next/link";
import AlertCard from "@/components/AlertCard";
import Forbidden from "@/components/Forbidden";
import { guardPage } from "@/lib/pageAuth";
import { getAlertsForUser, getPanchayat, getWardNumber, type AreaAlert } from "@/lib/area";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { WINDOW_DAYS, windowStart } from "@/lib/redLogic";

export const dynamic = "force-dynamic";

async function countReports(column: "ward_id" | "panchayat_id", id: number): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq(column, id)
    .gte("created_at", windowStart().toISOString());
  if (error) throw error;
  return count ?? 0;
}

export default async function CitizenHome() {
  const user = await guardPage(["citizen"]);
  if (!user) return <Forbidden />;

  let latest: AreaAlert | null = null;
  let wardCount: number | null = null;
  let panchayatCount: number | null = null;
  let place = { ml: "", en: "" };
  try {
    const [alerts, p, wardNo, wc, pc] = await Promise.all([
      getAlertsForUser(user, 1),
      user.panchayat_id ? getPanchayat(user.panchayat_id) : null,
      getWardNumber(user.ward_id),
      user.ward_id ? countReports("ward_id", user.ward_id) : 0,
      user.panchayat_id ? countReports("panchayat_id", user.panchayat_id) : 0,
    ]);
    latest = alerts[0] ?? null;
    wardCount = wc;
    panchayatCount = pc;
    if (p) {
      place = {
        ml: `വാർഡ് ${wardNo}, ${p.name_ml}, ${p.district_ml}`,
        en: `Ward ${wardNo}, ${p.name_en}, ${p.district_en}`,
      };
    }
  } catch (err) {
    console.error("[home/citizen] failed", err);
  }

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-bold">
          നമസ്കാരം, {user.display_name}
          <span className="label-en">{place.en}</span>
        </h1>
        {place.ml && <p className="mt-1 text-sm text-slate-600">{place.ml}</p>}
      </section>

      {latest ? (
        <section className="space-y-2">
          <h2 className="font-bold">
            പുതിയ അറിയിപ്പ് <span className="label-en inline">Latest alert</span>
          </h2>
          <AlertCard alert={latest} compact />
          <Link href="/alerts" className="block text-center text-sm underline">
            എല്ലാ അറിയിപ്പുകളും · All alerts
          </Link>
        </section>
      ) : (
        <p className="card text-center text-slate-600">
          നിങ്ങളുടെ പ്രദേശത്ത് ഇപ്പോൾ അറിയിപ്പുകൾ ഇല്ല.
          <span className="label-en">No alerts in your area right now.</span>
        </p>
      )}

      <section className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-primary">{wardCount ?? "–"}</p>
          <p className="text-sm">എന്റെ വാർഡ്</p>
          <p className="label-en">My ward</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-primary">{panchayatCount ?? "–"}</p>
          <p className="text-sm">പഞ്ചായത്ത്</p>
          <p className="label-en">Panchayat</p>
        </div>
        <p className="col-span-2 -mt-1 text-center text-xs text-slate-500">
          കഴിഞ്ഞ {WINDOW_DAYS} ദിവസത്തെ റിപ്പോർട്ടുകൾ · Reports in the last {WINDOW_DAYS} days (all residents, anonymous)
        </p>
      </section>

      <Link href="/report" className="btn-primary flex-col gap-0 py-3 text-center">
        രോഗം റിപ്പോർട്ട് ചെയ്യുക
        <span className="text-sm font-normal text-teal-100">Report illness</span>
      </Link>
      <Link href="/alerts" className="btn-outline flex-col gap-0 py-3 text-center">
        അറിയിപ്പുകൾ കാണുക
        <span className="text-sm font-normal">View alerts</span>
      </Link>
    </div>
  );
}
