"use client";

import { useEffect, useMemo, useState } from "react";
import { buildDiseaseAlertBody, MAX_ALERT_BODY } from "@/lib/alertTemplate";
import { useApi } from "@/components/useApi";

type Props = {
  diseases: { id: number; slug: string; name_en: string; name_ml: string }[];
  wards: { id: number; number: number }[];
  panchayatMl: string;
  initialDiseaseId?: number;
  initialWardId?: number;
};

export default function NewAlertForm({ diseases, wards, panchayatMl, initialDiseaseId, initialWardId }: Props) {
  const startWard = wards.find((w) => w.id === initialWardId);
  const [diseaseId, setDiseaseId] = useState<number>(
    diseases.find((d) => d.id === initialDiseaseId)?.id ?? diseases[0]?.id ?? 0,
  );
  const [target, setTarget] = useState<"all" | "wards">(startWard ? "wards" : "all");
  const [picked, setPicked] = useState<number[]>(startWard ? [startWard.id] : []);
  const [text, setText] = useState("");
  const [edited, setEdited] = useState(false);
  const [saved, setSaved] = useState(false);
  const { busy, error, call, setError } = useApi();

  const disease = diseases.find((d) => d.id === diseaseId);
  const wardNumbers = useMemo(
    () => (target === "wards" ? wards.filter((w) => picked.includes(w.id)).map((w) => w.number) : []),
    [target, picked, wards],
  );

  // Keep the template in sync until the officer starts editing the text by hand.
  useEffect(() => {
    if (edited || !disease) return;
    setText(
      buildDiseaseAlertBody({
        diseaseSlug: disease.slug,
        diseaseMl: disease.name_ml,
        panchayatMl,
        wardNumbers,
      }),
    );
  }, [disease, wardNumbers, panchayatMl, edited]);

  function toggle(id: number) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function submit() {
    if (target === "wards" && picked.length === 0) {
      setError("Choose at least one ward");
      return;
    }
    const ok = await call("/api/officer/alerts", "POST", {
      disease_id: diseaseId,
      target,
      ward_ids: target === "wards" ? picked : [],
      body_ml: text,
    });
    if (ok) {
      setSaved(true);
      setEdited(false);
      setPicked([]);
      setTarget("all");
    }
  }

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-bold">
        പുതിയ അറിയിപ്പ് <span className="label-en inline">New alert (saved as draft)</span>
      </h2>

      <label className="block">
        <span className="font-semibold">
          രോഗം <span className="label-en inline">Illness</span>
        </span>
        <select
          className="field mt-1"
          value={diseaseId}
          onChange={(e) => {
            setDiseaseId(Number(e.target.value));
            setSaved(false);
          }}
        >
          {diseases.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name_ml} · {d.name_en}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-2">
        <legend className="font-semibold">
          ആർക്ക് <span className="label-en inline">Send to</span>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(["all", "wards"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTarget(t);
                setSaved(false);
              }}
              className={`break-words rounded-xl border-2 p-2 text-center text-sm leading-snug ${
                target === t ? "border-primary bg-teal-50 font-semibold" : "border-slate-200"
              }`}
            >
              {t === "all" ? "മുഴുവൻ പഞ്ചായത്ത്" : "തിരഞ്ഞെടുത്ത വാർഡുകൾ"}
              <span className="label-en">{t === "all" ? "Whole panchayat" : "Selected wards"}</span>
            </button>
          ))}
        </div>
        {target === "wards" && (
          <div className="grid grid-cols-5 gap-2 pt-1">
            {wards.map((w) => (
              <label
                key={w.id}
                className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border-2 text-base ${
                  picked.includes(w.id) ? "border-alert bg-red-50 font-bold text-alert" : "border-slate-200"
                }`}
              >
                <input type="checkbox" className="sr-only" checked={picked.includes(w.id)} onChange={() => toggle(w.id)} />
                {w.number}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <label className="block">
        <span className="font-semibold">
          സന്ദേശം <span className="label-en inline">Message (edit before saving)</span>
        </span>
        <textarea
          className="field mt-1 min-h-[300px] py-3 text-base leading-relaxed"
          value={text}
          maxLength={MAX_ALERT_BODY}
          onChange={(e) => {
            setText(e.target.value);
            setEdited(true);
            setSaved(false);
          }}
        />
      </label>
      {edited && (
        <button type="button" className="text-sm underline" onClick={() => setEdited(false)}>
          ടെംപ്ലേറ്റ് വീണ്ടും ഉപയോഗിക്കുക · Reset to template
        </button>
      )}

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">{error}</p>}
      {saved && (
        <p className="rounded-xl bg-teal-50 p-3 text-primary">
          കരട് സേവ് ചെയ്തു. താഴെ നിന്ന് പ്രസിദ്ധീകരിക്കുക.
          <span className="label-en">Draft saved. Review and publish it below.</span>
        </p>
      )}
      <button type="button" className="btn-primary" disabled={busy || !text.trim()} onClick={submit}>
        {busy ? "സേവ് ചെയ്യുന്നു…" : "കരട് സേവ് ചെയ്യുക · Save draft"}
      </button>
    </section>
  );
}
