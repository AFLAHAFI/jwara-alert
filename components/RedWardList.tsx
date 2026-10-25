import type { RedWard, StateOverview } from "@/lib/admin";
import { pickName, wardLabel, type Dict, type Lang } from "@/lib/i18n";

export default function RedWardList({ items, data, t, lang }: { items: RedWard[]; data: StateOverview; t: Dict; lang: Lang }) {
  const dById = new Map(data.districts.map((d) => [d.id, d]));
  const pById = new Map(data.panchayats.map((p) => [p.id, p]));
  const sById = new Map(data.diseases.map((d) => [d.id, d]));
  const chip = {
    sent: { text: t.status_sent, cls: "bg-teal-100 text-primary-dark" },
    draft: { text: t.status_draft, cls: "bg-amber-100 text-amber-800" },
    none: { text: t.status_none, cls: "bg-red-100 text-alert" },
  };
  if (items.length === 0) return <p className="text-slate-600">{t.no_red}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((r) => (
        <li key={`${r.wardId}-${r.diseaseId}`} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="font-semibold">
              {pickName(sById.get(r.diseaseId), lang)} · <span className="tabular-nums">{r.count}</span>
            </p>
            <p className="text-sm text-slate-600">
              {wardLabel(t, r.wardNumber, r.wardName)}, {pickName(pById.get(r.panchayatId), lang)}, {pickName(dById.get(r.districtId), lang)}
            </p>
          </div>
          <span className={`chip shrink-0 text-xs ${chip[r.alerted].cls}`}>{chip[r.alerted].text}</span>
        </li>
      ))}
    </ul>
  );
}
