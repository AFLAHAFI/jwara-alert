import Link from "next/link";
import { notFound } from "next/navigation";
import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import RedWardList from "@/components/RedWardList";
import StatCard from "@/components/StatCard";
import { guardPage } from "@/lib/pageAuth";
import { getStateOverview, type StateOverview } from "@/lib/admin";
import { WINDOW_DAYS } from "@/lib/redLogic";
import { fmt, pickName } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function DistrictPage({ params }: { params: { id: string } }) {
  const user = await guardPage(["state_admin"]);
  if (!user) return <Forbidden />;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const { t, lang } = getT();

  let data: StateOverview | null = null;
  try {
    data = await getStateOverview();
  } catch (err) {
    console.error("[admin/district] failed", err);
  }
  if (!data)
    return (
      <p role="alert" className="err-box">
        {t.loadError}
      </p>
    );
  const district = data.districts.find((d) => d.id === id);
  if (!district) notFound();

  const s = data.byDistrict.get(id) ?? { reports: 0, redWards: 0, alerts: 0 };
  const panchayats = data.panchayats.filter((p) => p.district_id === id);
  const officersBy = new Map<number, typeof data.officers>();
  for (const o of data.officers) {
    if (!o.approved || o.panchayat_id === null) continue;
    officersBy.set(o.panchayat_id, [...(officersBy.get(o.panchayat_id) ?? []), o]);
  }

  return (
    <div className="space-y-5">
      <Link href="/home/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <Icon name="back" className="h-4 w-4" />
        {t.back_to_state}
      </Link>
      <section>
        <h1 className="page-title">{pickName(district, lang)}</h1>
        <p className="text-slate-600">{fmt(t.admin_sub, { n: WINDOW_DAYS })}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon="report" value={s.reports} label={t.kpi_reports} />
        <StatCard icon="alert" value={s.redWards} label={t.kpi_red_wards} tone={s.redWards ? "alert" : "primary"} />
        <StatCard icon="send" value={s.alerts} label={t.kpi_alerts} />
      </section>

      <section className="card space-y-3">
        <h2 className="section-title text-alert">
          <Icon name="alert" />
          {t.red_wards_title}
        </h2>
        <RedWardList items={data.redWards.filter((r) => r.districtId === id)} data={data} t={t} lang={lang} />
      </section>

      <section className="card space-y-3 overflow-hidden p-0">
        <h2 className="section-title px-5 pt-5">{t.panchayats_title}</h2>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="px-5 py-2 font-semibold">{t.col_panchayat}</th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">{t.col_reports}</th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">{t.col_red}</th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">{t.col_alerts}</th>
                <th scope="col" className="px-3 py-2 font-semibold">{t.col_officer}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {panchayats.map((p) => {
                const ps = data!.byPanchayat.get(p.id) ?? { reports: 0, redWards: 0, alerts: 0 };
                const offs = officersBy.get(p.id) ?? [];
                return (
                  <tr key={p.id} className={ps.redWards ? "bg-red-50/50" : ""}>
                    <th scope="row" className="px-5 py-3 font-semibold">{pickName(p, lang)}</th>
                    <td className="px-2 py-3 text-right tabular-nums">{ps.reports}</td>
                    <td className={`px-2 py-3 text-right tabular-nums ${ps.redWards ? "font-bold text-alert" : ""}`}>{ps.redWards}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{ps.alerts}</td>
                    <td className="px-3 py-3">
                      {offs.length === 0 ? (
                        <span className="chip bg-amber-100 text-xs text-amber-800">{t.no_officer_flag}</span>
                      ) : (
                        offs.map((o) => (
                          <span key={o.id} className={`block ${o.disabled ? "text-slate-400 line-through" : ""}`}>
                            {o.display_name}
                          </span>
                        ))
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
