import Forbidden from "@/components/Forbidden";
import OfficerNav from "@/components/OfficerNav";
import TaskBadge, { isOverdue } from "@/components/TaskBadge";
import WaitingApproval from "@/components/WaitingApproval";
import { guardPage } from "@/lib/pageAuth";
import { getTasks, type TaskRow } from "@/lib/area";
import { formatKolkata } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function OfficerTasks() {
  const user = await guardPage(["panchayat_officer"], { allowUnapproved: true });
  if (!user) return <Forbidden />;
  if (!user.approved) return <WaitingApproval />;
  if (!user.panchayat_id) return <Forbidden />;

  let tasks: TaskRow[] = [];
  let failed = false;
  try {
    tasks = await getTasks({ panchayatId: user.panchayat_id });
  } catch (err) {
    console.error("[officer/tasks] failed", err);
    failed = true;
  }
  const open = tasks.filter((t) => !t.done).length;
  const overdue = tasks.filter(isOverdue).length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        ജോലികൾ <span className="label-en">ASHA visit tasks</span>
      </h1>
      <OfficerNav active="/officer/tasks" />
      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="card p-3">
          <p className="text-2xl font-bold text-amber-700">{open}</p>
          <p className="label-en">Open</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-bold text-alert">{overdue}</p>
          <p className="label-en">Overdue</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-bold text-primary">{tasks.length - open}</p>
          <p className="label-en">Done</p>
        </div>
      </section>
      {failed && <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">Could not load tasks. Refresh the page.</p>}
      {!failed && tasks.length === 0 && (
        <p className="card text-center text-slate-600">
          ജോലികൾ ഇല്ല. അറിയിപ്പ് പ്രസിദ്ധീകരിച്ച ശേഷം ആശയ്ക്ക് നൽകുക.
          <span className="label-en">No tasks yet. Publish an alert, then assign ASHA visits from the Alerts page.</span>
        </p>
      )}
      {tasks.map((t) => (
        <article key={t.id} className={`card space-y-1 p-4 ${t.done ? "opacity-70" : ""}`}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">{t.title}</p>
            <TaskBadge task={t} />
          </div>
          <p className="text-sm text-slate-600">
            വാർഡ് {t.ward_number} · {t.asha_name ?? "—"}
            {t.disease_ml ? ` · ${t.disease_ml}` : ""}
          </p>
          {t.done && t.done_at && <p className="text-xs text-slate-500">Done {formatKolkata(t.done_at)} IST</p>}
        </article>
      ))}
    </div>
  );
}
