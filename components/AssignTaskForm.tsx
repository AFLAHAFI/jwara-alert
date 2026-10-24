"use client";

import { useState } from "react";
import { useApi } from "@/components/useApi";

type Props = {
  alertId: string;
  diseaseEn: string;
  wards: { id: number; number: number }[];
  ashas: { id: string; display_name: string }[];
};

function todayPlus(days: number): string {
  const d = new Date(Date.now() + 5.5 * 3600_000 + days * 86400_000);
  return d.toISOString().slice(0, 10);
}

export default function AssignTaskForm({ alertId, diseaseEn, wards, ashas }: Props) {
  const [open, setOpen] = useState(false);
  const [wardId, setWardId] = useState<number>(wards[0]?.id ?? 0);
  const [ashaId, setAshaId] = useState(ashas[0]?.id ?? "");
  const [due, setDue] = useState(todayPlus(2));
  const [title, setTitle] = useState("");
  const [done, setDone] = useState("");
  const { busy, error, call } = useApi();

  const wardNo = wards.find((w) => w.id === wardId)?.number ?? "";
  const autoTitle = `Visit homes in Ward ${wardNo} (${diseaseEn})`;

  if (ashas.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        ആശാ പ്രവർത്തകർ ഇല്ല. ആദ്യം &ldquo;ആശ&rdquo; പേജിൽ അക്കൗണ്ട് ഉണ്ടാക്കുക.
        <span className="label-en">No active ASHA workers yet. Add one on the ASHAs page first.</span>
      </p>
    );
  }

  if (!open) {
    return (
      <div className="space-y-2">
        {done && <p className="rounded-xl bg-teal-50 p-2 text-sm text-primary">{done}</p>}
        <button type="button" className="btn-outline text-base" onClick={() => setOpen(true)}>
          + ആശയ്ക്ക് ജോലി നൽകുക · Assign ASHA visit
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
      setDone(`Assigned to ${asha?.display_name}: Ward ${wardNo}`);
      setTitle("");
      setOpen(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-slate-50 p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-semibold">വാർഡ് · Ward</span>
          <select className="field mt-1" value={wardId} onChange={(e) => setWardId(Number(e.target.value))}>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.number}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">അവസാന തീയതി · Due</span>
          <input type="date" className="field mt-1 text-base" value={due} min={todayPlus(0)} onChange={(e) => setDue(e.target.value)} />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-semibold">ആശാ പ്രവർത്തക · ASHA worker</span>
        <select className="field mt-1" value={ashaId} onChange={(e) => setAshaId(e.target.value)}>
          {ashas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.display_name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-semibold">ജോലി · Task</span>
        <input className="field mt-1 text-base" placeholder={autoTitle} value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
      </label>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-2 text-alert">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-primary text-base" disabled={busy || !ashaId || !wardId} onClick={submit}>
          {busy ? "…" : "നൽകുക · Assign"}
        </button>
        <button type="button" className="btn-outline text-base" disabled={busy} onClick={() => setOpen(false)}>
          റദ്ദാക്കുക · Cancel
        </button>
      </div>
    </div>
  );
}
