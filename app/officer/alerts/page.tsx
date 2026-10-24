import AlertCard, { targetLabel } from "@/components/AlertCard";
import AssignTaskForm from "@/components/AssignTaskForm";
import DraftAlert from "@/components/DraftAlert";
import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import NewAlertForm from "@/components/NewAlertForm";
import TaskBadge from "@/components/TaskBadge";
import VisitSummary from "@/components/VisitSummary";
import WaitingApproval from "@/components/WaitingApproval";
import { guardPage } from "@/lib/pageAuth";
import {
  getAshas,
  getDiseases,
  getPanchayat,
  getPanchayatAlerts,
  getTasks,
  getWards,
  type AreaAlert,
  type AshaRow,
  type Disease,
  type PanchayatInfo,
  type TaskRow,
  type WardRow,
} from "@/lib/area";
import { LANGS, fmt, pickName, wardLabel, type Lang } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

function names(row: { name_en: string; name_ml: string; name_hi: string | null } | null): Record<Lang, string> {
  return { ml: pickName(row, "ml"), en: pickName(row, "en"), hi: pickName(row, "hi") };
}

export default async function OfficerAlerts({ searchParams }: { searchParams: { disease?: string; ward?: string } }) {
  const user = await guardPage(["panchayat_officer"], { allowUnapproved: true });
  if (!user) return <Forbidden />;
  if (!user.approved) return <WaitingApproval />;
  if (!user.panchayat_id) return <Forbidden />;
  const { t, lang } = getT();

  let diseases: Disease[] = [];
  let wards: WardRow[] = [];
  let alerts: AreaAlert[] = [];
  let ashas: AshaRow[] = [];
  let tasks: TaskRow[] = [];
  let panchayat: PanchayatInfo | null = null;
  let failed = false;
  try {
    [diseases, wards, alerts, ashas, tasks, panchayat] = await Promise.all([
      getDiseases(),
      getWards(user.panchayat_id),
      getPanchayatAlerts(user.panchayat_id),
      getAshas(user.panchayat_id),
      getTasks({ panchayatId: user.panchayat_id }),
      getPanchayat(user.panchayat_id),
    ]);
  } catch (err) {
    console.error("[officer/alerts] failed", err);
    failed = true;
  }
  const activeAshas = ashas.filter((x) => !x.disabled);
  const drafts = alerts.filter((a) => a.status === "draft");
  const published = alerts.filter((a) => a.status === "published");
  const now = Date.now();

  return (
    <div className="space-y-5">
      <h1 className="page-title">{t.oa_title}</h1>

      {failed ? (
        <p role="alert" className="err-box">
          {t.loadError}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          <NewAlertForm
            key={`${searchParams.disease ?? ""}-${searchParams.ward ?? ""}`}
            diseases={diseases.map((d) => ({ id: d.id, slug: d.slug, names: names(d) }))}
            wards={wards}
            panchayatNames={names(panchayat)}
            initialDiseaseId={Number(searchParams.disease) || undefined}
            initialWardId={Number(searchParams.ward) || undefined}
          />

          <div className="space-y-5">
            {drafts.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h2 className="section-title text-amber-800">{fmt(t.drafts, { n: drafts.length })}</h2>
                  <p className="text-sm text-slate-600">{t.drafts_note}</p>
                </div>
                {drafts.map((a) => (
                  <DraftAlert
                    key={a.id}
                    id={a.id}
                    bodies={{ ml: a.body_ml, en: a.body_en ?? "", hi: a.body_hi ?? "" }}
                    title={a.disease ? pickName(a.disease, lang) : t.health_alert}
                    target={targetLabel(a, t)}
                  />
                ))}
              </section>
            )}

            <section className="space-y-3">
              <h2 className="section-title">
                <Icon name="send" />
                {t.published}
              </h2>
              {published.length === 0 && <p className="card text-center text-slate-600">{t.nothing_published}</p>}
              {published.map((a) => {
                const alertTasks = tasks.filter((x) => x.alert_id === a.id);
                const taskWards = a.target === "wards" && a.wards.length ? a.wards : wards;
                const sent = LANGS.filter((l) => (l === "ml" ? true : l === "en" ? !!a.body_en : !!a.body_hi));
                return (
                  <div key={a.id} className="space-y-2">
                    <AlertCard alert={a} t={t} lang={lang} compact now={now} />
                    <p className="px-1 text-xs text-slate-500">
                      {fmt(t.languages_sent, { list: sent.map((l) => l.toUpperCase()).join(" · ") })}
                    </p>
                    <div className="card space-y-3 p-4">
                      <p className="section-title text-base">
                        <Icon name="users" className="h-4 w-4" />
                        {fmt(t.asha_visits, { n: alertTasks.length })}
                      </p>
                      {alertTasks.map((x) => (
<div key={x.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span>
                            {wardLabel(t, x.ward_number, x.ward_name)} · {x.asha_name}
                          </span>
                          <TaskBadge task={x} t={t} lang={lang} />
                        </div>
                          <VisitSummary task={x} t={t} />
                        </div>
                      ))}
                      <AssignTaskForm
                        alertId={a.id}
                        illness={a.disease ? pickName(a.disease, lang) : t.health_alert}
                        wards={taskWards}
                        ashas={activeAshas}
                      />
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
