import Icon from "@/components/Icon";
import type { TaskRow } from "@/lib/area";
import { fmt, formatDay, type Dict, type Lang } from "@/lib/i18n";

export function isOverdue(t: Pick<TaskRow, "done" | "due_date">): boolean {
  if (t.done || !t.due_date) return false;
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  return t.due_date < today;
}

export default function TaskBadge({ task, t, lang }: { task: TaskRow; t: Dict; lang: Lang }) {
  if (task.done) {
    return (
      <span className="chip shrink-0 bg-teal-100 text-xs text-primary-dark">
        <Icon name="check" className="h-3.5 w-3.5" />
        {t.done}
      </span>
    );
  }
  if (isOverdue(task)) {
    return <span className="chip shrink-0 bg-red-100 text-xs text-alert">{t.overdue}</span>;
  }
  return (
    <span className="chip shrink-0 bg-amber-100 text-xs text-amber-800">
      {task.due_date ? fmt(t.dueOn, { date: formatDay(task.due_date, lang) }) : t.open}
    </span>
  );
}
