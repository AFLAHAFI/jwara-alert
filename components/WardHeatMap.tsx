import Link from "next/link";
import { RED_THRESHOLD } from "@/lib/redLogic";

export type HeatCell = { wardId: number; number: number; name: string | null; value: number };
export type HeatLevel = "none" | "low" | "watch" | "red";

export function heatLevel(v: number): HeatLevel {
  if (v >= RED_THRESHOLD) return "red";
  if (v >= 3) return "watch";
  if (v >= 1) return "low";
  return "none";
}

// Status colours with a text label in every cell and a legend, so colour is never the only cue.
export const HEAT_STYLE: Record<HeatLevel, string> = {
  none: "bg-slate-100 text-slate-500 border-slate-200",
  low: "bg-emerald-100 text-emerald-900 border-emerald-300",
  watch: "bg-amber-200 text-amber-950 border-amber-400",
  red: "bg-alert text-white border-red-700",
};

export default function WardHeatMap({
  cells,
  selected,
  hrefFor,
  labels,
}: {
  cells: HeatCell[];
  selected?: number;
  hrefFor: (wardId: number) => string;
  labels: Record<HeatLevel, string>;
}) {
  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {cells.map((c) => {
          const lvl = heatLevel(c.value);
          const title = `${c.number}${c.name ? ` · ${c.name}` : ""}: ${c.value} (${labels[lvl]})`;
          return (
            <li key={c.wardId}>
              <Link
                href={hrefFor(c.wardId)}
                scroll={false}
                title={title}
                aria-label={title}
                aria-current={selected === c.wardId ? "true" : undefined}
                className={`flex min-h-[64px] flex-col items-center justify-center rounded-xl border-2 px-1 py-1 text-center leading-tight transition hover:brightness-95 ${HEAT_STYLE[lvl]} ${
                  selected === c.wardId ? "ring-2 ring-ink ring-offset-2" : ""
                }`}
              >
                <span className="text-base font-bold">{c.number}</span>
                <span className="w-full truncate text-[11px] opacity-90">{c.name ?? ""}</span>
                <span className="text-xs font-semibold tabular-nums">{c.value}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600" aria-label="legend">
        {(["none", "low", "watch", "red"] as HeatLevel[]).map((l) => (
          <li key={l} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded border ${HEAT_STYLE[l]}`} aria-hidden />
            {labels[l]}
          </li>
        ))}
      </ul>
    </div>
  );
}
