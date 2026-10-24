import Link from "next/link";
import BarChart from "@/components/BarChart";
import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import WaitingApproval from "@/components/WaitingApproval";
import { guardPage } from "@/lib/pageAuth";
import {
  alertStatusFor,
  getDiseases,
  getPanchayat,
  getPanchayatAlerts,
  getWards,
  getWindowReports,
  type AlertStatus,
  type AreaAlert,
  type Disease,
  type PanchayatInfo,
} from "@/lib/area";
import { countByWardAndDisease, RED_THRESHOLD, WINDOW_DAYS, windowStart, type WardDiseaseCounts } from "@/lib/redLogic";
import { fmt, pickName } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type RedHit = { wardId: number; number: number; disease: Disease; count: number; status: AlertStatus };

export default async function OfficerHome({ searchParams }: { searchParams: { disease?: string } }) {
  const user = await guardPage(["panchayat_officer"], { allowUnapproved: true });
  if (!user) return <Forbidden />;
  if (!user.approved) return <WaitingApproval />;
  if (!user.panchayat_id) return <Forbidden />;
  const { t, lang } = getT();

  let panchayat: PanchayatInfo | null = null;
  let diseases: Disease[] = [];
  let counts: WardDiseaseCounts[] = [];
  let alerts: AreaAlert[] = [];
  let failed = false;
  try {
    const [p, d, wards, reports, a] = await Promise.all([
      getPanchayat(user.panchayat_id),
      getDiseases(),
      getWards(user.panchayat_id),
      getWindowReports(user.panchayat_id),
      getPanchayatAlerts(user.panchayat_id),
    ]);
    panchayat = p;
    diseases = d;
    counts = countByWardAndDisease(wards, reports);
    alerts = a;
  } catch (err) {
    console.error("[home/officer] failed", err);
    failed = true;
  }

  const filterId = Number(searchParams.disease) || 0;
  const filter = diseases.find((d) => d.id === filterId) ?? null;
  const byId = new Map(diseases.map((d) => [d.id, d]));
  const sinceMs = windowStart().getTime();

  // Red = one illness reaching the limit in a ward (not a mix of different illnesses).
  const redHits: RedHit[] = [];
  for (const w of counts) {
    for (const [did, n] of Array.from(w.byDisease.entries())) {
      const disease = byId.get(did);
      if (disease && n >= RED_THRESHOLD && (!filter || filter.id === did)) {
        redHits.push({ wardId: w.wardId, number: w.number, disease, count: n, status: alertStatusFor(alerts, w.wardId, did, sinceMs) });
      }
    }
  }
  redHits.sort((a, b) => b.count - a.count);
  const redWardIds = new Set(redHits.map((h) => h.wardId));

  const rows = counts.map((w) => ({
    key: w.wardId,
    label: fmt(t.wardN, { n: w.number }),
    count: filter ? w.byDisease.get(filter.id) ?? 0 : w.total,
    red: redWardIds.has(w.wardId),
  }));
  const total = rows.reduce((s, r) => s + r.count, 0);

  const totals = new Map<number, number>();
  for (const w of counts) for (const [did, n] of Array.from(w.byDisease.entries())) totals.set(did, (totals.get(did) ?? 0) + n);
  const top = Array.from(totals.entries())
    .filter(([did]) => byId.has(did))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const statusChip: Record<AlertStatus, { text: string; cls: string }> = {
    sent: { text: t.status_sent, cls: "bg-teal-100 text-primary-dark" },
    draft: { text: t.status_draft, cls: "bg-amber-100 text-amber-800" },
    none: { text: t.status_none, cls: "bg-red-100 text-alert" },
  };

  return (
    <div className="space-y-5">
      <section>
        <h1 className="page-title">{panchayat ? pickName(panchayat, lang) : t.panchayat}</h1>
        <p className="mt-1 flex items-center gap-1 text-slate-600">
          <Icon name="pin" className="h-4 w-4" />
          {panchayat ? pickName(panchayat.district, lang) : ""} · {user.designation ?? t.role_panchayat_officer}
        </p>
      </section>

      {failed && (
        <p role="alert" className="err-box">
          {t.loadError}
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-3xl font-bold text-primary tabular-nums">{total}</p>
          <p className="text-sm text-slate-600">{fmt(t.dash_reports, { n: WINDOW_DAYS })}</p>
        </div>
        <div className="card p-4">
          <p className={`text-3xl font-bold tabular-nums ${redWardIds.size ? "text-alert" : "text-primary"}`}>{redWardIds.size}</p>
          <p className="text-sm text-slate-600">{t.dash_red_wards}</p>
        </div>
        <div className="card col-span-2 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-600">{t.top_illnesses}</p>
          {top.length === 0 ? (
            <p className="text-sm text-slate-500">{t.no_reports}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {top.map(([did, n]) => (
                <span key={did} className="chip bg-slate-100 text-ink">
                  {pickName(byId.get(did), lang)} <b className="tabular-nums">{n}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="section-title text-alert">
            <Icon name="alert" />
            {t.red_wards_title}
          </h2>
          {redHits.length === 0 ? (
            <p className="card flex items-center gap-2 text-slate-600">
              <Icon name="check" className="h-5 w-5 text-primary" />
              {t.no_red}
            </p>
          ) : (
            redHits.map((h) => (
              <div key={`${h.wardId}-${h.disease.id}`} className="card space-y-3 border-alert/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold">
                      {fmt(t.wardN, { n: h.number })} · {pickName(h.disease, lang)}
                    </p>
                    <p className="text-sm text-slate-600">{fmt(t.red_hit, { count: h.count, illness: pickName(h.disease, lang) })}</p>
                  </div>
                  <span className={`chip shrink-0 text-xs ${statusChip[h.status].cls}`}>{statusChip[h.status].text}</span>
                </div>
                {h.status === "sent" ? (
                  <Link href="/officer/alerts" className="btn-ghost btn-sm">
                    {t.view_alert}
                  </Link>
                ) : (
                  <Link href={`/officer/alerts?disease=${h.disease.id}&ward=${h.wardId}`} className="btn-danger btn-sm">
                    <Icon name="bell" className="h-4 w-4" />
                    {h.status === "draft" ? t.view_alert : t.create_alert}
                  </Link>
                )}
              </div>
            ))
          )}
          <p className="text-xs text-slate-500">{fmt(t.red_rule, { n: RED_THRESHOLD, d: WINDOW_DAYS })}</p>
        </section>

        <section className="card space-y-4">
          <h2 className="section-title">
            <Icon name="chart" />
            {t.reports_per_ward}
          </h2>
          <form className="flex items-end gap-2" action="/home/officer">
            <label className="block flex-1">
              <span className="label text-sm">{t.illness_filter}</span>
              <select name="disease" defaultValue={filter ? String(filter.id) : ""} className="field text-base">
                <option value="">{t.all_illnesses}</option>
                {diseases.map((d) => (
                  <option key={d.id} value={d.id}>
                    {pickName(d, lang)}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="min-h-btn rounded-2xl bg-primary px-4 font-semibold text-white">
              {t.show}
            </button>
          </form>
          {rows.length === 0 ? (
            <p className="text-slate-500">{t.no_wards}</p>
          ) : (
            <BarChart rows={rows} caption={fmt(t.red_line, { n: RED_THRESHOLD })} />
          )}
        </section>
      </div>
    </div>
  );
}
