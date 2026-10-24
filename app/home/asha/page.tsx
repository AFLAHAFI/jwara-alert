import Forbidden from "@/components/Forbidden";
import TaskBadge from "@/components/TaskBadge";
import TaskDoneButton from "@/components/TaskDoneButton";
import { guardPage } from "@/lib/pageAuth";
import { getPanchayat, getTasks, type TaskRow } from "@/lib/area";

export const dynamic = "force-dynamic";

export default async function AshaHome() {
  const user = await guardPage(["asha"]);
  if (!user) return <Forbidden />;

  let tasks: TaskRow[] = [];
  let place = "";
  let failed = false;
  try {
    const [t, p] = await Promise.all([
      getTasks({ assignedTo: user.id }),
      user.panchayat_id ? getPanchayat(user.panchayat_id) : null,
    ]);
    tasks = t;
    place = p ? `${p.name_ml} · ${p.name_en}` : "";
  } catch (err) {
    console.error("[home/asha] failed", err);
    failed = true;
  }
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-bold">
          നമസ്കാരം, {user.display_name}
          <span className="label-en">ASHA worker · {place}</span>
        </h1>
        <p className="mt-2 text-lg">
          <b className="text-primary">{open.length}</b> സന്ദർശനങ്ങൾ ബാക്കി
          <span className="label-en">{open.length} visits to do</span>
        </p>
      </section>

      {failed && <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">Could not load tasks. Refresh the page.</p>}
      {!failed && tasks.length === 0 && (
        <p className="card text-center text-slate-600">
          ഇപ്പോൾ ജോലികൾ ഇല്ല. <span className="label-en">No tasks assigned to you right now.</span>
        </p>
      )}

      {open.map((t) => (
        <article key={t.id} className="card space-y-3 border-l-4 border-l-primary">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-lg font-bold">വാർഡ് {t.ward_number}</p>
              <p className="text-sm text-slate-600">{t.disease_ml ?? ""}</p>
            </div>
            <TaskBadge task={t} />
          </div>
          <p>{t.title}</p>
          <p className="text-sm text-slate-600">
            വീടുകൾ സന്ദർശിക്കുക, പനിയുള്ളവരെ ആരോഗ്യ കേന്ദ്രത്തിലേക്ക് റഫർ ചെയ്യുക, മുൻകരുതലുകൾ വിശദീകരിക്കുക.
            <span className="label-en">Visit homes, refer people with fever to the health centre, explain precautions.</span>
          </p>
          <TaskDoneButton id={t.id} done={false} />
        </article>
      ))}

      {done.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold text-slate-600">
            ചെയ്തവ <span className="label-en inline">Done ({done.length})</span>
          </h2>
          {done.map((t) => (
            <article key={t.id} className="card space-y-2 p-4 opacity-80">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">
                  വാർഡ് {t.ward_number} · {t.disease_ml}
                </p>
                <TaskBadge task={t} />
              </div>
              <TaskDoneButton id={t.id} done />
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
