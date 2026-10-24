import Link from "next/link";
import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import KeralaMap from "@/components/KeralaMap";
import PendingOfficers from "@/components/PendingOfficers";
import RedWardList from "@/components/RedWardList";
import StatCard from "@/components/StatCard";
import { guardPage } from "@/lib/pageAuth";
import { getStateOverview, type StateOverview } from "@/lib/admin";
import { WINDOW_DAYS } from "@/lib/redLogic";
import { fmt, pickName } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const user = await guardPage(["state_admin"]);
  if (!user) return <Forbidden />;
  const { t, lang } = getT();

  let data: StateOverview | null = null;
  try {
    data = await getStateOverview();
  } catch (err) {
    console.error("[home/admin] failed", err);
  }

  const districtRows = data
    ? [...data.districts]
        .map((d) => ({ d, s: data!.byDistrict.get(d.id) ?? { reports: 0, redWards: 0, alerts: 0 } }))
        .sort((a, b) => b.s.redWards - a.s.redWards || b.s.reports - a.s.reports || pickName(a.d, lang).localeCompare(pickName(b.d, lang)))
    : [];
  const top = data
    ? Array.from(data.byDisease.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];
  const sById = new Map((data?.diseases ?? []).map((d) => [d.id, d]));

  return (
    <div className="space-y-5">
      <section>
        <h1 className="page-title">{t.admin_title}</h1>
        <p className="text-slate-600">{fmt(t.admin_sub, { n: WINDOW_DAYS })}</p>
      </section>

      {!data ? (
        <p role="alert" className="err-box">
          {t.loadError}
        </p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard icon="report" value={data.totals.reports} label={t.kpi_reports} />
            <StatCard icon="alert" value={data.totals.redWards} label={t.kpi_red_wards} tone={data.totals.redWards ? "alert" : "primary"} />
            <StatCard icon="send" value={data.totals.alerts} label={t.kpi_alerts} />
            <StatCard icon="tasks" value={`${data.totals.openVisits} / ${data.totals.openVisits + data.totals.doneVisits}`} label={t.kpi_visits} tone="amber" />
            <StatCard icon="home" value={data.totals.homesVisited} label={t.kpi_homes} />
            <StatCard icon="users" value={data.totals.referred} label={t.kpi_referred} tone={data.totals.referred ? "alert" : "primary"} />
          </section>

          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <section className="card space-y-3 lg:row-span-2">
              <h2 className="section-title">
                <Icon name="pin" />
                {t.kerala_map}
              </h2>
              <KeralaMap districts={data.districts} stats={data.byDistrict} t={t} lang={lang} />
            </section>

            <section className="card space-y-3">
              <h2 className="section-title text-alert">
                <Icon name="alert" />
                {t.red_wards_state}
              </h2>
              <RedWardList items={data.redWards} data={data} t={t} lang={lang} />
            </section>

            <section className="card space-y-3">
              <h2 className="section-title">
                <Icon name="chart" />
                {t.top_illnesses}
              </h2>
              {top.length === 0 ? (
                <p className="text-slate-600">{t.no_reports}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {top.map(([id, n]) => (
                    <span key={id} className="chip bg-slate-100 text-ink">
                      {pickName(sById.get(id), lang)} <b className="tabular-nums">{n}</b>
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="card space-y-3 overflow-hidden p-0">
            <h2 className="section-title px-5 pt-5">
              <Icon name="pin" />
              {t.districts_title}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th scope="col" className="px-5 py-2 font-semibold">{t.col_district}</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">{t.col_reports}</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">{t.col_red}</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">{t.col_alerts}</th>
                    <th scope="col" className="w-8 px-2 py-2"><span className="sr-only">{t.open}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {districtRows.map(({ d, s }) => (
                    <tr key={d.id} className={s.redWards ? "bg-red-50/50" : ""}>
                      <th scope="row" className="px-5 py-3 font-semibold">
                        <Link href={`/admin/district/${d.id}`} className="hover:underline">
                          {pickName(d, lang)}
                        </Link>
                      </th>
                      <td className="px-2 py-3 text-right tabular-nums">{s.reports}</td>
                      <td className={`px-2 py-3 text-right tabular-nums ${s.redWards ? "font-bold text-alert" : ""}`}>{s.redWards}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{s.alerts}</td>
                      <td className="px-2 py-3">
                        <Link href={`/admin/district/${d.id}`} aria-label={pickName(d, lang)} className="text-primary">
                          <Icon name="chevron" className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="card space-y-3">
        <h2 className="section-title">
          <Icon name="shield" />
          {t.officer_approvals}
        </h2>
        <PendingOfficers />
      </section>
    </div>
  );
}
