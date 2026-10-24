import Icon from "@/components/Icon";
import { fmt, wardLabel } from "@/lib/i18n";
import type { Dict } from "@/lib/i18n";
import type { ElderWithCheckin } from "@/lib/elder";

export default function EldersList({
  elders,
  t,
}: {
  elders: ElderWithCheckin[];
  t: Dict;
}) {
  const currentYear = new Date().getFullYear();

  if (elders.length === 0) {
    return (
      <div className="card text-center text-slate-500 py-6">
        <p className="font-semibold">{t.no_elders_found}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {elders.map((e) => {
        const notCheckedIn = !e.checked_in;
        const urgent = notCheckedIn && e.lives_alone;
        const age = e.birth_year ? currentYear - e.birth_year : null;

        return (
          <article
            key={e.id}
            className={`card space-y-2 border-l-4 p-4 shadow-sm transition-all ${
              urgent
                ? "border-l-alert bg-red-50/50"
                : notCheckedIn
                ? "border-l-amber-500 bg-amber-50/30"
                : "border-l-emerald-600 bg-emerald-50/20"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-slate-900">{e.display_name}</p>
                <p className="text-sm font-semibold text-slate-600">
                  {wardLabel(t, e.ward_number, e.ward_name)}
                  {age !== null ? ` · ${fmt(t.age_years, { n: age })}` : ""}
                  {e.lives_alone ? ` · ${t.lives_alone}` : ""}
                </p>
              </div>

              <div>
                {notCheckedIn ? (
                  <span
                    className={`chip font-bold text-xs uppercase tracking-wider ${
                      urgent ? "bg-red-100 text-alert" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {t.no_checkin_today}
                  </span>
                ) : (
                  <span className="chip bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                    <Icon name="check" className="h-3.5 w-3.5 stroke-[3]" />
                    {t.checked_in_today}
                  </span>
                )}
              </div>
            </div>

            {e.family_phone && (
              <div className="pt-1">
                <a
                  href={`tel:${e.family_phone}`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                >
                  <Icon name="phone" className="h-4 w-4 shrink-0" />
                  <span>{t.call_family}: {e.family_phone}</span>
                </a>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
