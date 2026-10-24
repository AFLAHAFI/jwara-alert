"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { useApi } from "@/components/useApi";
import { fmt } from "@/lib/i18n";

type Props = {
  alertId: string;
  illness: string;
  wards: { id: number; number: number }[];
  ashas: { id: string; display_name: string }[];
};

function todayPlus(days: number): string {
  const d = new Date(Date.now() + 5.5 * 3600_000 + days * 86400_000);
  return d.toISOString().slice(0, 10);
}

export default function AssignTaskForm({ alertId, illness, wards, ashas }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [wardId, setWardId] = useState<number>(wards[0]?.id ?? 0);
  const [ashaId, setAshaId] = useState(ashas[0]?.id ?? "");
  const [due, setDue] = useState(todayPlus(2));
  const [title, setTitle] = useState("");
  const [done, setDone] = useState("");
  const { busy, error, call } = useApi();

  const wardNo = wards.find((w) => w.id === wardId)?.number ?? "";
  const autoTitle = fmt(t.task_title_auto, { n: wardNo, illness });

  if (ashas.length === 0) {
    return <p className="text-sm text-slate-600">{t.no_ashas_active}</p>;
  }

  if (!open) {
    return (
      <div className="space-y-2">
        {done && (
          <p role="status" className="ok-box text-sm">
            {done}
          </p>
        )}
        <button type="button" className="btn-outline btn-sm" onClick={() => setOpen(true)}>
          <Icon name="plus" className="h-4 w-4" />
          {t.assign_asha}
        </button>
      </div>
    );
  }

  async function submit() {
    const asha = ashas.find((a) => a.id === ashaId);
    const ok = await call("/api/officer/tasks", "POST", {
      alert_id: alertId,
      ward_id: wardId,
      assigned_to: ashaId,
      title: title.trim() || autoTitle,
      due_date: due,
    });
    if (ok) {
      setDone(fmt(t.assigned_ok, { name: asha?.display_name ?? "", n: wardNo }));
      setTitle("");
      setOpen(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-slate-50 p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="label text-sm">{t.ward}</span>
          <select className="field text-base" value={wardId} onChange={(e) => setWardId(Number(e.target.value))}>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.number}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label text-sm">{t.due_date}</span>
          <input type="date" className="field text-base" value={due} min={todayPlus(0)} onChange={(e) => setDue(e.target.value)} />
        </label>
      </div>
      <label className="block">
        <span className="label text-sm">{t.asha_worker}</span>
        <select className="field text-base" value={ashaId} onChange={(e) => setAshaId(e.target.value)}>
          {ashas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.display_name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label text-sm">{t.task}</span>
        <input className="field text-base" placeholder={autoTitle} value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
      </label>
      {error && (
        <p role="alert" className="err-box">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-primary btn-sm" disabled={busy || !ashaId || !wardId} onClick={submit}>
          {busy ? t.pleaseWait : t.assign}
        </button>
        <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => setOpen(false)}>
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
