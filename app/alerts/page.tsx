"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, getStoredPin } from "@/components/PinGate";
import EmergencyNumbers from "@/components/EmergencyNumbers";
import { formatKolkata } from "@/lib/time";

type Alert = {
  id: string;
  ward: number;
  status: "draft" | "published";
  body_ml: string;
  created_at: string;
  published_at: string | null;
};

function AlertCard({ alert, admin, onChanged }: { alert: Alert; admin: boolean; onChanged: () => void }) {
  const [text, setText] = useState(alert.body_ml);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const isDraft = alert.status === "draft";

  async function send(payload: object, okMsg: string) {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await adminFetch(`/api/alerts/${alert.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg(okMsg);
      onChanged();
    } catch (err) {
      console.error("alert update failed", err);
      setMsg("ഇത് സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക. / Could not save. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`card ${isDraft ? "border-amber-300" : "border-alert/40"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-lg font-bold text-alert">വാർഡ് {alert.ward}</span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isDraft ? "bg-amber-100 text-amber-900" : "bg-teal-100 text-primary-dark"
          }`}
        >
          {isDraft ? "കരട് / Draft" : "പ്രസിദ്ധീകരിച്ചു / Published"}
        </span>
      </div>
      {isDraft && admin ? (
        <textarea
          className="field min-h-[16rem] py-3 leading-relaxed"
          value={text}
          maxLength={3000}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
        />
      ) : (
        <p className="whitespace-pre-line leading-relaxed">{alert.body_ml}</p>
      )}
      <p className="mt-2 text-xs text-slate-500">
        {formatKolkata(alert.published_at ?? alert.created_at)} IST
      </p>
      {isDraft && admin && (
        <div className="mt-3 space-y-2">
          <button
            className="btn-outline"
            disabled={busy || text === alert.body_ml || !text.trim()}
            onClick={() => send({ body_ml: text }, "മാറ്റങ്ങൾ സേവ് ചെയ്തു. / Saved.")}
          >
            മാറ്റങ്ങൾ സേവ് ചെയ്യുക
          </button>
          <button
            className="btn-danger flex-col gap-0 py-2"
            disabled={busy || !text.trim()}
            onClick={() => send({ body_ml: text, publish: true }, "പ്രസിദ്ധീകരിച്ചു. / Published; ASHA task created.")}
          >
            {busy ? "ദയവായി കാത്തിരിക്കുക…" : "അംഗീകരിച്ച് പ്രസിദ്ധീകരിക്കുക"}
            <span className="text-sm font-normal text-red-100">Approve and publish</span>
          </button>
        </div>
      )}
      {msg && <p className="mt-2 text-sm text-primary-dark">{msg}</p>}
    </article>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = getStoredPin() ? await adminFetch("/api/alerts") : await fetch("/api/alerts");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAlerts(json.alerts as Alert[]);
      setAdmin(Boolean(json.isAdmin));
    } catch (err) {
      console.error("alerts load failed", err);
      setError("അറിയിപ്പുകൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല. / Could not load alerts.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        അറിയിപ്പുകൾ
        <span className="label-en">Fever alerts from the health center</span>
      </h1>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">
          {error}{" "}
          <button className="underline" onClick={load}>
            Retry
          </button>
        </p>
      )}
      {!alerts && !error && <p className="text-center text-slate-500">ലോഡ് ചെയ്യുന്നു…</p>}
      {alerts && alerts.length === 0 && (
        <p className="card text-center text-slate-600">
          ഇപ്പോൾ അറിയിപ്പുകൾ ഒന്നുമില്ല.
          <span className="label-en">No alerts right now.</span>
        </p>
      )}
      {alerts?.map((a) => (
        <AlertCard key={`${a.id}-${a.status}`} alert={a} admin={admin} onChanged={load} />
      ))}
      <p className="text-center text-sm text-slate-500">
        ഇത് മാതൃകാ അറിയിപ്പാണ്. യഥാർത്ഥ ഉപയോഗത്തിന് ആരോഗ്യ വകുപ്പിന്റെ അംഗീകാരം വേണം.
        <span className="label-en">Example alerts. Real use needs health department approval.</span>
      </p>
      {admin && (
        <Link href="/dashboard" className="block text-center text-sm underline">
          ← Dashboard
        </Link>
      )}
      <EmergencyNumbers />
    </div>
  );
}
