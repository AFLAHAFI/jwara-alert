import Icon from "@/components/Icon";
import ShareWhatsApp from "@/components/ShareWhatsApp";
import { SITE_URL } from "@/lib/site";
import type { AreaAlert } from "@/lib/area";
import { fmt, formatDateTime, pickBody, pickName, type Dict, type Lang } from "@/lib/i18n";

export function targetLabel(a: Pick<AreaAlert, "target" | "wards">, t: Dict): string {
  if (a.target === "all" || a.wards.length === 0) return t.allWards;
  return fmt(t.wardsList, { list: a.wards.map((w) => w.number).join(", ") });
}

const DAY = 24 * 60 * 60 * 1000;

export default function AlertCard({
  alert,
  t,
  lang,
  compact = false,
  now,
  share = true,
}: {
  alert: AreaAlert;
  t: Dict;
  lang: Lang;
  compact?: boolean;
  /** Request time (ms), passed in so rendering stays pure. */
  now: number;
  /** Show the WhatsApp share button (published alerts). */
  share?: boolean;
}) {
  const when = alert.published_at ?? alert.created_at;
  const isNew = now - new Date(when).getTime() < DAY;
  const body = pickBody(alert, lang);
  return (
    <article className="card space-y-3 border-l-4 border-l-alert">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="chip bg-red-50 text-alert">
          <Icon name="alert" className="h-4 w-4" />
          {alert.disease ? pickName(alert.disease, lang) : t.health_alert}
        </span>
        <span className="flex items-center gap-2 text-sm text-slate-500">
          {isNew && <span className="chip bg-alert py-0.5 text-xs text-white">{t.new_badge}</span>}
          <time dateTime={when}>{formatDateTime(when, lang)}</time>
        </span>
      </div>
      <p className="flex items-center gap-1 text-sm font-semibold text-slate-600">
        <Icon name="pin" className="h-4 w-4" />
        {targetLabel(alert, t)}
      </p>
      <p
        lang={body.fallback ? "ml" : lang}
        className={`whitespace-pre-wrap leading-relaxed ${compact ? "line-clamp-5 text-base" : "text-lg"}`}
      >
        {body.text}
      </p>
      {body.fallback && <p className="text-xs text-slate-500">{t.only_ml_note}</p>}
      {share && alert.status === "published" && <ShareWhatsApp text={body.text} url={SITE_URL} t={t} />}
    </article>
  );
}
