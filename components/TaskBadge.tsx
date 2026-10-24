import type { TaskRow } from "@/lib/area";
import { formatKolkataDate } from "@/lib/time";

export function isOverdue(t: Pick<TaskRow, "done" | "due_date">): boolean {
  if (t.done || !t.due_date) return false;
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  return t.due_date < today;
}

export default function TaskBadge({ task }: { task: TaskRow }) {
  if (task.done) {
    return <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-primary">✓ ചെയ്തു · Done</span>;
  }
  if (isOverdue(task)) {
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-alert">വൈകി · Overdue</span>;
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
      ബാക്കി · Open{task.due_date ? ` · ${formatKolkataDate(task.due_date)}` : ""}
    </span>
  );
}
