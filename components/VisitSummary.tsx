import type { TaskRow } from "@/lib/area";
import { fmt, type Dict } from "@/lib/i18n";

/** "12 homes · 3 with fever · 1 referred" plus the ASHA's note, when a report exists. */
export default function VisitSummary({ task, t }: { task: TaskRow; t: Dict }) {
  if (!task.done || task.visit.homes === null) return null;
  return (
    <div className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-primary-dark">
      <p className="font-semibold tabular-nums">
        {fmt(t.visit_summary, { homes: task.visit.homes ?? 0, fever: task.visit.fever ?? 0, referred: task.visit.referred ?? 0 })}
      </p>
      {task.visit.note && <p className="mt-0.5 text-slate-700">“{task.visit.note}”</p>}
    </div>
  );
}
