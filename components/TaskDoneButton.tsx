"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { useApi } from "@/components/useApi";

type Visit = { homes: number | null; fever: number | null; referred: number | null; note: string | null };

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="label text-sm">{label}</span>
      <input
        className="field text-center text-xl tabular-nums"
        type="number"
        inputMode="numeric"
        min={0}
        max={1000}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** Mark a visit done with a short visit report, or reopen it. */
export default function TaskDoneButton({ id, done, visit }: { id: string; done: boolean; visit?: Visit }) {
  const { t } = useI18n();
  const { busy, error, call, setError } = useApi();
  const [open, setOpen] = useState(false);
  const [homes, setHomes] = useState(visit?.homes != null ? String(visit.homes) : "");
  const [fever, setFever] = useState(visit?.fever != null ? String(visit.fever) : "");
  const [referred, setReferred] = useState(visit?.referred != null ? String(visit.referred) : "");
  const [note, setNote] = useState(visit?.note ?? "");

  if (done) {
    return (
      <div>
        <button type="button" disabled={busy} onClick={() => call(`/api/asha/tasks/${id}`, "PATCH", { done: false })} className="btn-ghost btn-sm">
          {busy ? t.pleaseWait : t.mark_not_done}
        </button>
        {error && (
          <p role="alert" className="mt-1 text-sm text-alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        <Icon name="check" className="h-6 w-6" />
        {t.mark_done}
      </button>
    );
  }

  const toNum = (s: string) => (s.trim() === "" ? 0 : Number(s));

  async function submit() {
    const v = { homes: toNum(homes), fever: toNum(fever), referred: toNum(referred), note };
    if (![v.homes, v.fever, v.referred].every((n) => Number.isInteger(n) && n >= 0 && n <= 1000) || note.length > 500) {
      setError(t.err_visit_numbers);
      return;
    }
    await call(`/api/asha/tasks/${id}`, "PATCH", { done: true, visit: v });
  }

  return (
    <div className="space-y-3 rounded-xl bg-slate-50 p-3">
      <p className="font-semibold">{t.visit_report_title}</p>
      <div className="grid grid-cols-3 gap-2">
        <NumberField label={t.visit_homes} value={homes} onChange={setHomes} />
        <NumberField label={t.visit_fever} value={fever} onChange={setFever} />
        <NumberField label={t.visit_referred} value={referred} onChange={setReferred} />
      </div>
      <label className="block">
        <span className="label text-sm">{t.visit_note}</span>
        <textarea
          className="field min-h-[80px] py-2 text-base"
          value={note}
          maxLength={500}
          placeholder={t.visit_note_hint}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="err-box">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={submit}>
          <Icon name="check" className="h-5 w-5" />
          {busy ? t.pleaseWait : t.save_visit}
        </button>
        <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => setOpen(false)}>
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
