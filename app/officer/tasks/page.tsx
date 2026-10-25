import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import TaskBadge, { isOverdue } from "@/components/TaskBadge";
import VisitSummary from "@/components/VisitSummary";
import WaitingApproval from "@/components/WaitingApproval";
import { guardPage } from "@/lib/pageAuth";
import { getTasks, visitTotals, type TaskRow } from "@/lib/area";
import { fmt, formatDateTime, pickName, wardLabel } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function OfficerTasks() {
  const user = await guardPage(["panchayat_officer"], { allowUnapproved: true });
  if (!user) return <Forbidden />;
  if (!user.approved) return <WaitingApproval />;
  if (!user.panchayat_id) return <Forbidden />;
  const { t, lang } = getT();

  let tasks: TaskRow[] = [];
  let failed = false;
  try {
    tasks = await getTasks({ panchayatId: user.panchayat_id });
  } catch (err) {
    console.error("[officer/tasks] failed", err);
    failed = true;
  }
  const open = tasks.filter((x) => !x.done).length;
  const overdue = tasks.filter(isOverdue).length;
  const vt = visitTotals(tasks);

  return (
    <div className="space-y-5">
      <h1 className="page-title">{t.tasks_title}</h1>
      <section className="grid grid-cols-3 gap-3 text-center">
        <div className="card p-3">
          <p className="text-2xl font-bold text-amber-700 tabular-nums">{open}</p>
          <p className="text-sm text-slate-600">{t.open}</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-bold text-alert tabular-nums">{overdue}</p>
          <p className="text-sm text-slate-600">{t.overdue}</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-bold text-primary tabular-nums">{tasks.length - open}</p>
          <p className="text-sm text-slate-600">{t.done}</p>
        </div>
      </section>
      {vt.reported > 0 && (
        <section className="card space-y-2 p-4">
          <h2 className="section-title text-base">
            <Icon name="users" className="h-4 w-4" />
            {t.visit_totals}
          </h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold tabular-nums text-primary">{vt.homes}</p>
              <p className="text-xs text-slate-600">{t.visit_homes}</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-amber-700">{vt.fever}</p>
              <p className="text-xs text-slate-600">{t.visit_fever}</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-alert">{vt.referred}</p>
              <p className="text-xs text-slate-600">{t.visit_referred}</p>
            </div>
          </div>
        </section>
      )}
      {failed && (
        <p role="alert" className="err-box">
          {t.loadError}
        </p>
      )}
      {!failed && tasks.length === 0 && (
        <div className="card space-y-2 text-center text-slate-600">
          <Icon name="tasks" className="mx-auto h-10 w-10 text-slate-300" />
          <p>{t.no_tasks_officer}</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {tasks.map((x) => (
          <article key={x.id} className={`card space-y-1 p-4 ${x.done ? "opacity-70" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{x.title}</p>
              <TaskBadge task={x} t={t} lang={lang} />
            </div>
            <p className="text-sm text-slate-600">
              {wardLabel(t, x.ward_number, x.ward_name)} · {x.asha_name ?? "—"}
              {x.disease ? ` · ${pickName(x.disease, lang)}` : ""}
            </p>
            {x.done && x.done_at && <p className="text-xs text-slate-500">{fmt(t.doneAt, { date: formatDateTime(x.done_at, lang) })}</p>}
            <VisitSummary task={x} t={t} />
          </article>
        ))}
      </div>
    </div>
  );
}
