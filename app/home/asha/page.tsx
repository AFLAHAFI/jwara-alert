import Forbidden from "@/components/Forbidden";
import Icon from "@/components/Icon";
import TaskBadge from "@/components/TaskBadge";
import TaskDoneButton from "@/components/TaskDoneButton";
import { guardPage } from "@/lib/pageAuth";
import { getPanchayat, getTasks, type TaskRow } from "@/lib/area";
import { fmt, pickName } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AshaHome() {
  const user = await guardPage(["asha"]);
  if (!user) return <Forbidden />;
  const { t, lang } = getT();

  let tasks: TaskRow[] = [];
  let place = "";
  let failed = false;
  try {
    const [list, p] = await Promise.all([
      getTasks({ assignedTo: user.id }),
      user.panchayat_id ? getPanchayat(user.panchayat_id) : null,
    ]);
    tasks = list;
    place = pickName(p, lang);
  } catch (err) {
    console.error("[home/asha] failed", err);
    failed = true;
  }
  const open = tasks.filter((x) => !x.done);
  const done = tasks.filter((x) => x.done);

  return (
    <div className="narrow space-y-5">
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
      {!failed && tasks.length === 0 && (
        <div className="card space-y-2 text-center text-slate-600">
          <Icon name="check" className="mx-auto h-10 w-10 text-primary" />
          <p>{t.no_tasks_asha}</p>
        </div>
      )}

      {open.map((x) => (
        <article key={x.id} className="card space-y-3 border-l-4 border-l-primary">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xl font-bold">{fmt(t.wardN, { n: x.ward_number ?? "" })}</p>
              {x.disease && <p className="text-slate-600">{pickName(x.disease, lang)}</p>}
            </div>
            <TaskBadge task={x} t={t} lang={lang} />
          </div>
          <p className="font-semibold">{x.title}</p>
          <p className="text-sm text-slate-600">{t.visit_instructions}</p>
          <TaskDoneButton id={x.id} done={false} />
        </article>
      ))}

      {done.length > 0 && (
        <section className="space-y-2">
          <h2 className="section-title text-slate-600">{fmt(t.done_list, { n: done.length })}</h2>
          {done.map((x) => (
            <article key={x.id} className="card space-y-2 p-4 opacity-80">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">
                  {fmt(t.wardN, { n: x.ward_number ?? "" })}
                  {x.disease ? ` · ${pickName(x.disease, lang)}` : ""}
                </p>
                <TaskBadge task={x} t={t} lang={lang} />
              </div>
              <TaskDoneButton id={x.id} done />
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
