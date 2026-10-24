import { RED_THRESHOLD } from "@/lib/redLogic";

export type BarRow = { key: string | number; label: string; count: number; red: boolean };

/** Horizontal bars with a dashed red-limit line. Pure server markup. */
export default function BarChart({ rows, caption, limit = RED_THRESHOLD }: { rows: BarRow[]; caption: string; limit?: number }) {
  const max = Math.max(limit, ...rows.map((r) => r.count));
  return (
    <figure className="space-y-2">
      <ul className="space-y-2">
        {rows.map((r) => {
          const pct = Math.max(r.count > 0 ? 6 : 0, Math.round((r.count / max) * 100));
          return (
            <li key={r.key} className="flex items-center gap-2">
              <span className={`w-20 shrink-0 truncate text-sm ${r.red ? "font-bold text-alert" : "text-slate-700"}`}>{r.label}</span>
              <div
                className="relative h-7 flex-1 overflow-hidden rounded-lg bg-slate-100"
                role="img"
                aria-label={`${r.label}: ${r.count}`}
              >
                <div className={`h-full rounded-lg ${r.red ? "bg-alert" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                <span
                  aria-hidden
                  className="absolute inset-y-0"
                  style={{ left: `${(limit / max) * 100}%`, borderLeft: "2px dashed #DC2626", opacity: 0.55 }}
                />
              </div>
              <span className={`w-7 text-right text-sm tabular-nums ${r.red ? "font-bold text-alert" : ""}`}>{r.count}</span>
            </li>
          );
        })}
      </ul>
      <figcaption className="text-xs text-slate-500">{caption}</figcaption>
    </figure>
  );
}
