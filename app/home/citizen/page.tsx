import Link from "next/link";
import AlertCard from "@/components/AlertCard";
import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import { guardPage } from "@/lib/pageAuth";
import { getAlertsForUser, getPanchayat, getWardNumber, type AreaAlert } from "@/lib/area";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { WINDOW_DAYS, windowStart } from "@/lib/redLogic";
import { fmt, pickName } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

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
  const { t, lang } = getT();

  let latest: AreaAlert | null = null;
  let wardCount: number | null = null;
  let panchayatCount: number | null = null;
  let place = "";
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
    if (p) place = `${fmt(t.wardN, { n: wardNo ?? "" })}, ${pickName(p, lang)}, ${pickName(p.district, lang)}`;
  } catch (err) {
    console.error("[home/citizen] failed", err);
  }

  return (
    <div className="narrow space-y-5">
      <section className="card">
        <h1 className="text-xl font-bold">{fmt(t.hello, { name: user.display_name })}</h1>
        {place && (
          <p className="mt-1 flex items-center gap-1 text-slate-600">
            <Icon name="pin" className="h-4 w-4 shrink-0" />
            {place}
          </p>
        )}
      </section>

      <Link href="/report" className="btn-primary min-h-[64px] text-xl">
        <Icon name="report" className="h-6 w-6" />
        {t.cta_report}
      </Link>

      {latest ? (
        <section className="space-y-2">
          <h2 className="section-title">
            <Icon name="bell" className="h-5 w-5 text-alert" />
            {t.latest_alert}
          </h2>
          <AlertCard alert={latest} t={t} lang={lang} compact now={Date.now()} />
          <Link href="/alerts" className="flex items-center justify-center gap-1 text-sm font-semibold text-primary underline">
            {t.all_alerts}
            <Icon name="chevron" className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <p className="card flex items-center gap-3 text-slate-600">
          <Icon name="check" className="h-6 w-6 shrink-0 text-primary" />
          {t.no_alerts_now}
        </p>
      )}

      <section className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-primary">{wardCount ?? "–"}</p>
            <p className="text-sm text-slate-600">{t.my_ward}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-primary">{panchayatCount ?? "–"}</p>
            <p className="text-sm text-slate-600">{t.panchayat_total}</p>
          </div>
        </div>
        <p className="text-center text-xs text-slate-500">{fmt(t.counts_note, { n: WINDOW_DAYS })}</p>
      </section>
    </div>
  );
}
