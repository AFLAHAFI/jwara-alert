"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import LangTabs from "@/components/LangTabs";
import { useI18n } from "@/components/I18nProvider";
import { useApi } from "@/components/useApi";
import { buildDiseaseAlertBody, MAX_ALERT_BODY } from "@/lib/alertTemplate";
import { LANGS, LANG_LABEL, fmt, type Lang } from "@/lib/i18n";

type Names = Record<Lang, string>;
type Props = {
  diseases: { id: number; slug: string; names: Names }[];
  wards: { id: number; number: number }[];
  panchayatNames: Names;
  initialDiseaseId?: number;
  initialWardId?: number;
};

const EMPTY: Record<Lang, string> = { ml: "", en: "", hi: "" };
const NOT_EDITED: Record<Lang, boolean> = { ml: false, en: false, hi: false };

/** Random v4 UUID. Falls back when crypto.randomUUID is missing (Safari before 15.4, old Chrome). */
function newClientRef(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export default function NewAlertForm({ diseases, wards, panchayatNames, initialDiseaseId, initialWardId }: Props) {
  const { t, lang: uiLang } = useI18n();
  const startWard = wards.find((w) => w.id === initialWardId);
  const [diseaseId, setDiseaseId] = useState<number>(
    diseases.find((d) => d.id === initialDiseaseId)?.id ?? diseases[0]?.id ?? 0,
  );
  const [target, setTarget] = useState<"all" | "wards">(startWard ? "wards" : "all");
  const [picked, setPicked] = useState<number[]>(startWard ? [startWard.id] : []);
  const [langs, setLangs] = useState<Lang[]>([...LANGS]);
  const [tab, setTab] = useState<Lang>("ml");
  const [texts, setTexts] = useState<Record<Lang, string>>(EMPTY);
  const [edited, setEdited] = useState<Record<Lang, boolean>>(NOT_EDITED);
  const [saved, setSaved] = useState(false);
  // One id per draft being written; a retry with the same id cannot create a second draft.
  const [clientRef, setClientRef] = useState(newClientRef);
  const { busy, error, call, setError } = useApi();

  const disease = diseases.find((d) => d.id === diseaseId);
  const wardNumbers = useMemo(
    () => (target === "wards" ? wards.filter((w) => picked.includes(w.id)).map((w) => w.number) : []),
    [target, picked, wards],
  );

  // Keep each language's template in sync until the officer edits that language by hand.
  useEffect(() => {
    if (!disease) return;
    setTexts((prev) => {
      const next = { ...prev };
      for (const l of LANGS) {
        if (edited[l]) continue;
        next[l] = buildDiseaseAlertBody({
          lang: l,
          diseaseSlug: disease.slug,
          diseaseName: disease.names[l],
          panchayatName: panchayatNames[l],
          wardNumbers,
        });
      }
      return next;
    });
  }, [disease, wardNumbers, panchayatNames, edited]);

  function toggleWard(id: number) {
    setSaved(false);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function toggleLang(l: Lang) {
    if (l === "ml") return;
    setSaved(false);
    setLangs((cur) => {
      const next = cur.includes(l) ? cur.filter((x) => x !== l) : LANGS.filter((x) => x === l || cur.includes(x));
      if (!next.includes(tab)) setTab("ml");
      return next;
    });
  }

  async function submit() {
    if (target === "wards" && picked.length === 0) {
      setError(t.err_pick_ward);
      return;
    }
    const ok = await call("/api/officer/alerts", "POST", {
      disease_id: diseaseId,
      target,
      ward_ids: target === "wards" ? picked : [],
      client_ref: clientRef,
      bodies: {
        ml: texts.ml,
        en: langs.includes("en") ? texts.en : null,
        hi: langs.includes("hi") ? texts.hi : null,
      },
    });
    if (ok) {
      setSaved(true);
      setClientRef(newClientRef());
      setEdited(NOT_EDITED);
      setPicked([]);
      setTarget("all");
    }
  }

  return (
    <section className="card space-y-5">
      <div>
        <h2 className="section-title">
          <Icon name="plus" />
          {t.new_alert}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t.new_alert_note}</p>
      </div>

      <label className="block">
        <span className="label">{t.illness}</span>
        <select
          className="field"
          value={diseaseId}
          onChange={(e) => {
            setDiseaseId(Number(e.target.value));
            setSaved(false);
          }}
        >
          {diseases.map((d) => (
            <option key={d.id} value={d.id}>
              {d.names[uiLang]}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-2">
        <legend className="label">{t.send_to}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["all", "wards"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={target === v}
              onClick={() => {
                setTarget(v);
                setSaved(false);
              }}
              className={`min-h-[52px] rounded-xl border-2 p-2 text-center text-sm font-semibold leading-snug ${
                target === v ? "border-primary bg-teal-50 text-primary-dark" : "border-slate-200 text-slate-700"
              }`}
            >
              {v === "all" ? t.whole_panchayat : t.selected_wards}
            </button>
          ))}
        </div>
        {target === "wards" && (
          <div className="grid grid-cols-5 gap-2 pt-1 sm:grid-cols-10">
            {wards.map((w) => {
              const on = picked.includes(w.id);
              return (
                <label
                  key={w.id}
                  className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border-2 text-base font-semibold ${
                    on ? "border-alert bg-red-50 text-alert" : "border-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => toggleWard(w.id)}
                    aria-label={fmt(t.wardN, { n: w.number })}
                  />
                  {w.number}
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="label">{t.alert_languages}</legend>
        <div className="flex flex-wrap gap-2">
          {LANGS.map((l) => (
            <label
              key={l}
              className={`chip cursor-pointer border-2 py-2 ${
                langs.includes(l) ? "border-primary bg-teal-50 text-primary-dark" : "border-slate-200 text-slate-500"
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={langs.includes(l)}
                disabled={l === "ml"}
                onChange={() => toggleLang(l)}
              />
              {LANG_LABEL[l]}
            </label>
          ))}
        </div>
        <p className="hint">{t.ml_always}</p>
      </fieldset>

      <div className="space-y-2">
        <span className="label">{t.message}</span>
        <LangTabs langs={langs} active={tab} onPick={setTab} />
        <textarea
          lang={tab}
          aria-label={fmt(t.message_in, { lang: LANG_LABEL[tab] })}
          className="field min-h-[300px] py-3 text-base leading-relaxed"
          value={texts[tab]}
          maxLength={MAX_ALERT_BODY}
          onChange={(e) => {
            const v = e.target.value;
            setTexts((p) => ({ ...p, [tab]: v }));
            setEdited((p) => ({ ...p, [tab]: true }));
            setSaved(false);
          }}
        />
        {edited[tab] && (
          <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => setEdited((p) => ({ ...p, [tab]: false }))}>
            {t.reset_template}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="err-box">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="ok-box">
          {t.draft_saved}
        </p>
      )}
      <button type="button" className="btn-primary" disabled={busy || !texts.ml.trim()} onClick={submit}>
        {busy ? t.saving : t.save_draft}
      </button>
    </section>
  );
}
