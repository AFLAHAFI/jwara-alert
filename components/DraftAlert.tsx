"use client";

import { useState } from "react";
import LangTabs from "@/components/LangTabs";
import { useI18n } from "@/components/I18nProvider";
import { useApi } from "@/components/useApi";
import { MAX_ALERT_BODY } from "@/lib/alertTemplate";
import { LANGS, LANG_LABEL, fmt, type Lang } from "@/lib/i18n";

type Props = { id: string; title: string; target: string; bodies: Record<Lang, string> };

export default function DraftAlert({ id, title, target, bodies }: Props) {
  const { t } = useI18n();
  const [texts, setTexts] = useState<Record<Lang, string>>(bodies);
  const [tab, setTab] = useState<Lang>("ml");
  const [confirming, setConfirming] = useState(false);
  const { busy, error, call } = useApi();
  const dirty = LANGS.some((l) => texts[l] !== bodies[l]);
  const payload = { ml: texts.ml, en: texts.en || null, hi: texts.hi || null };
  const filled = { ml: !!texts.ml.trim(), en: !!texts.en.trim(), hi: !!texts.hi.trim() };

  return (
    <div className="card space-y-3 border-amber-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm text-slate-600">{target}</p>
        </div>
        <span className="chip shrink-0 bg-amber-100 text-amber-800">{t.draft_badge}</span>
      </div>
      <LangTabs langs={[...LANGS]} active={tab} onPick={setTab} filled={filled} />
      <textarea
        lang={tab}
        aria-label={fmt(t.message_in, { lang: LANG_LABEL[tab] })}
        className="field min-h-[240px] py-3 text-base leading-relaxed"
        value={texts[tab]}
        maxLength={MAX_ALERT_BODY}
        disabled={busy}
        onChange={(e) => {
          const v = e.target.value;
          setTexts((p) => ({ ...p, [tab]: v }));
        }}
      />
      <p className="hint">{t.lang_empty_note}</p>
      {error && (
        <p role="alert" className="err-box">
          {error}
        </p>
      )}
      {confirming ? (
        <div className="space-y-2 rounded-xl bg-red-50 p-3" role="alertdialog" aria-label={t.publish_confirm}>
          <p className="font-semibold">{t.publish_confirm}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn-danger btn-sm"
              disabled={busy || !filled.ml}
              onClick={() => call(`/api/officer/alerts/${id}/publish`, "POST", { bodies: payload })}
            >
              {busy ? t.publishing : t.publish_yes}
            </button>
            <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => setConfirming(false)}>
              {t.cancel}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <button type="button" className="btn-primary" disabled={busy || !filled.ml} onClick={() => setConfirming(true)}>
            {t.publish}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn-outline btn-sm"
              disabled={busy || !dirty || !filled.ml}
              onClick={() => call(`/api/officer/alerts/${id}`, "PATCH", { bodies: payload })}
            >
              {t.save}
            </button>
            <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => call(`/api/officer/alerts/${id}`, "DELETE")}>
              {t.discard}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
