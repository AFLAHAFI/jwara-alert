"use client";

import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { useApi } from "@/components/useApi";
import { formatDateTime, wardLabel } from "@/lib/i18n";
import type { SosRequest } from "@/lib/elder";

export default function SosList({ list }: { list: SosRequest[] }) {
  const { t, lang } = useI18n();
  const { busy, error, call } = useApi();

  if (list.length === 0) {
    return (
      <div className="card text-center text-slate-500 py-6">
        <Icon name="check" className="mx-auto h-8 w-8 text-primary mb-2" />
        <p className="font-semibold">{t.no_sos_alerts}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="err-box">
          {error}
        </p>
      )}
      {list.map((x) => {
        const isOpen = x.status === "open";
        const isAccepted = x.status === "accepted";
        const hasLocation = typeof x.lat === "number" && typeof x.lng === "number";
        const mapUrl = hasLocation
          ? `https://www.openstreetmap.org/?mlat=${x.lat}&mlon=${x.lng}#map=17/${x.lat}/${x.lng}`
          : null;

        return (
          <article
            key={x.id}
            className={`card space-y-3 border-l-4 p-4 shadow-sm ${
              isOpen ? "border-l-alert bg-red-50/40" : "border-l-amber-500 bg-amber-50/30"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {x.user?.display_name || t.elder_badge}
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  {wardLabel(t, x.ward_number, x.ward_name)} · {formatDateTime(x.created_at, lang)}
                </p>
              </div>
              <span
                className={`chip font-bold uppercase text-xs tracking-wider ${
                  isOpen ? "bg-red-100 text-alert" : "bg-amber-100 text-amber-800"
                }`}
              >
                {isOpen ? t.status_open : isAccepted ? t.status_accepted : t.status_resolved}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {x.user?.family_phone && (
                <a
                  href={`tel:${x.user.family_phone}`}
                  className="btn-ghost flex items-center gap-1.5 border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  <Icon name="phone" className="h-4 w-4 text-primary" />
                  <span>{t.call_family}: {x.user.family_phone}</span>
                </a>
              )}

              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost flex items-center gap-1.5 border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  <Icon name="pin" className="h-4 w-4 text-alert" />
                  <span>{t.map}</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              {isOpen && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => call(`/api/sos/${x.id}`, "PATCH", { action: "accept" })}
                  className="btn-primary btn-sm bg-amber-600 hover:bg-amber-700"
                >
                  {t.btn_accept}
                </button>
              )}
              {(isOpen || isAccepted) && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => call(`/api/sos/${x.id}`, "PATCH", { action: "resolve" })}
                  className="btn-primary btn-sm bg-emerald-600 hover:bg-emerald-700"
                >
                  {t.btn_resolve}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
