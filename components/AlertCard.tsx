import type { AreaAlert } from "@/lib/area";
import { formatKolkata } from "@/lib/time";

export function targetLabel(a: Pick<AreaAlert, "target" | "wards">): { ml: string; en: string } {
  if (a.target === "all" || a.wards.length === 0) return { ml: "എല്ലാ വാർഡുകളും", en: "All wards" };
  const nums = a.wards.map((w) => w.number).join(", ");
  return { ml: `വാർഡ് ${nums}`, en: `Ward ${nums}` };
}

export default function AlertCard({ alert, compact = false }: { alert: AreaAlert; compact?: boolean }) {
  const t = targetLabel(alert);
  const when = alert.published_at ?? alert.created_at;
  return (
    <article className="card border-l-4 border-l-alert">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-alert">
          {alert.disease ? `${alert.disease.name_ml} · ${alert.disease.name_en}` : "ആരോഗ്യ അറിയിപ്പ്"}
        </span>
        <time dateTime={when} className="text-slate-500">
          {formatKolkata(when)} IST
        </time>
      </div>
      <p className="mb-2 text-sm font-semibold text-slate-600">
        {t.ml} · {t.en}
      </p>
      <p className={`whitespace-pre-wrap leading-relaxed ${compact ? "line-clamp-4 text-base" : "text-lg"}`}>
        {alert.body_ml}
      </p>
    </article>
  );
}
