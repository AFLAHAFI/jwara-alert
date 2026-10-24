import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import TaskBadge from "@/components/TaskBadge";
import TaskDoneButton from "@/components/TaskDoneButton";
import VisitSummary from "@/components/VisitSummary";
import SosList from "@/components/SosList";
import AddElderForm from "@/components/AddElderForm";
import EldersList from "@/components/EldersList";
import { guardPage } from "@/lib/pageAuth";
import { getPanchayat, getTasks, getWards, type TaskRow, type WardRow } from "@/lib/area";
import { getEldersInPanchayat, getSosRequests, type ElderWithCheckin, type SosRequest } from "@/lib/elder";
import { fmt, pickName, wardLabel } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AshaHome() {
  const user = await guardPage(["asha"]);
  if (!user) return <Forbidden />;
  const { t, lang } = getT();

  let tasks: TaskRow[] = [];
  let place = "";
  let failed = false;
  let sosList: SosRequest[] = [];
  let elders: ElderWithCheckin[] = [];
  let wards: WardRow[] = [];

  try {
    const [list, p, sosData, elderData, wardData] = await Promise.all([
      getTasks({ assignedTo: user.id }),
      user.panchayat_id ? getPanchayat(user.panchayat_id) : null,
      user.panchayat_id ? getSosRequests(user.panchayat_id, ["open", "accepted"]) : Promise.resolve([]),
      user.panchayat_id ? getEldersInPanchayat(user.panchayat_id) : Promise.resolve([]),
      user.panchayat_id ? getWards(user.panchayat_id) : Promise.resolve([]),
    ]);
    tasks = list;
    place = pickName(p, lang);
    sosList = sosData;
    elders = elderData;
    wards = wardData;
  } catch (err) {
    console.error("[home/asha] failed", err);
    failed = true;
  }

  const open = tasks.filter((x) => !x.done);
  const done = tasks.filter((x) => x.done);

  return (
    <div className="narrow space-y-6">
      {/* 1. Header greeting */}
      <section className="card">
        <h1 className="text-xl font-bold">{fmt(t.hello, { name: user.display_name })}</h1>
        <p className="mt-1 flex items-center gap-1 text-slate-600">
          <Icon name="pin" className="h-4 w-4" />
          {t.role_asha}
          {place ? ` · ${place}` : ""}
        </p>
        <p className="mt-3 text-lg font-semibold text-primary">{fmt(t.visits_to_do, { n: open.length })}</p>
      </section>

      {failed && (
        <p role="alert" className="err-box">
          {t.loadError}
        </p>
      )}

      {/* 2. Top of page: SOS alerts in her panchayat */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title text-xl font-bold flex items-center gap-2 text-alert">
            <Icon name="alert" className="h-6 w-6 text-alert shrink-0" />
            {t.sos_alerts} {sosList.length > 0 && `(${sosList.length})`}
          </h2>
        </div>
        <SosList list={sosList} />
      </section>

      {/* 3. ASHA Visit Tasks */}
      <section className="space-y-3">
        <h2 className="section-title text-xl font-bold flex items-center gap-2">
          <Icon name="tasks" className="h-5 w-5 text-primary" />
          {t.nav_tasks}
        </h2>

        {!failed && tasks.length === 0 && (
          <div className="card space-y-2 text-center text-slate-600">
            <Icon name="check" className="mx-auto h-10 w-10 text-primary" />
            <p>{t.no_tasks_asha}</p>
          </div>
        )}

        {open.map((x) => (
          <article key={x.id} className="card space-y-3 border-l-4 border-l-primary">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xl font-bold">{wardLabel(t, x.ward_number, x.ward_name)}</p>
                {x.disease && <p className="text-slate-600">{pickName(x.disease, lang)}</p>}
              </div>
              <TaskBadge task={x} t={t} lang={lang} />
            </div>
            <p className="font-semibold">{x.title}</p>
            <p className="text-sm text-slate-600">{t.visit_instructions}</p>
            <TaskDoneButton id={x.id} done={false} visit={x.visit} />
          </article>
        ))}

        {done.length > 0 && (
          <section className="space-y-2 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              {fmt(t.done_list, { n: done.length })}
            </h3>
            {done.map((x) => (
              <article key={x.id} className="card space-y-2 p-4 opacity-80">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {wardLabel(t, x.ward_number, x.ward_name)}
                    {x.disease ? ` · ${pickName(x.disease, lang)}` : ""}
                  </p>
                  <TaskBadge task={x} t={t} lang={lang} />
                </div>
                <VisitSummary task={x} t={t} />
                <TaskDoneButton id={x.id} done />
              </article>
            ))}
          </section>
        )}
      </section>

      {/* 4. Elders in my panchayat */}
      <section className="space-y-3">
        <h2 className="section-title text-xl font-bold flex items-center gap-2">
          <Icon name="users" className="h-5 w-5 text-primary" />
          {t.elders_in_panchayat}
        </h2>
        <EldersList elders={elders} t={t} />
      </section>

      {/* 5. Add elder section */}
      {wards.length > 0 && <AddElderForm wards={wards} />}
    </div>
  );
}
