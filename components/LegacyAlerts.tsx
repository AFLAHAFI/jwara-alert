"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { adminFetch, getStoredPin } from "@/components/PinGate";
import { formatKolkata } from "@/lib/time";

type Alert = {
  id: string;
  ward: number;
  body_ml: string;
  status: "draft" | "published";
  created_at: string;
  published_at: string | null;
};

export default function LegacyAlerts() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState("");
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    setHasPin(Boolean(getStoredPin()));
  }, []);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await adminFetch("/api/alerts");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { alerts: Alert[]; admin: boolean };
      setAlerts(json.alerts);
      setAdmin(json.admin);
    } catch (err) {
      console.error("alerts load failed", err);
      setError("അറിയിപ്പുകൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const drafts = alerts?.filter((a) => a.status === "draft") ?? [];
  const published = alerts?.filter((a) => a.status === "published") ?? [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">
        അറിയിപ്പുകൾ
        <span className="label-en">Published health alerts, newest first</span>
      </h1>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">
          {error}
          <span className="label-en">Could not load alerts.</span>
          <button className="mt-2 block underline" onClick={load}>
            വീണ്ടും ശ്രമിക്കുക / Retry
          </button>
        </p>
      )}

      {!alerts && !error && <p className="text-center text-slate-500">ലോഡ് ചെയ്യുന്നു…</p>}

      {admin && drafts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-alert">
            കരട് അറിയിപ്പുകൾ ({drafts.length})
            <span className="label-en">Drafts — only you can see these. Edit, then approve.</span>
          </h2>
          {drafts.map((a) => (
            <DraftEditor key={a.id} alert={a} onChanged={load} />
          ))}
        </section>
      )}

      {alerts && published.length === 0 && (
        <p className="card text-center text-slate-600">
          ഇപ്പോൾ അറിയിപ്പുകൾ ഒന്നുമില്ല.
          <span className="label-en">No published alerts right now.</span>
        </p>
      )}

      {published.map((a) => (
        <article key={a.id} className="card border-l-4 border-l-alert">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
            <span className="font-semibold text-ink">വാർഡ് {a.ward}</span>
            <time dateTime={a.published_at ?? a.created_at}>
              {formatKolkata(a.published_at ?? a.created_at)} IST
            </time>
          </div>
          <p className="whitespace-pre-wrap text-lg leading-relaxed">{a.body_ml}</p>
        </article>
      ))}

      <p className="text-center text-sm text-slate-500">
        മാതൃകാ ഡാറ്റ · Example data only
        {!hasPin && (
          <>
            {" "}
            ·{" "}
            <Link href="/dashboard" className="underline">
              Admin
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function DraftEditor({ alert, onChanged }: { alert: Alert; onChanged: () => Promise<void> }) {
  const [text, setText] = useState(alert.body_ml);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const inFlight = useRef(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const dirty = text !== alert.body_ml;

  async function save() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy("save");
    setErr("");
    setMsg("");
    try {
      const res = await adminFetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        body: JSON.stringify({ body_ml: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg("സേവ് ചെയ്തു / Saved");
      await onChanged();
    } catch (e) {
      console.error("save draft failed", e);
      setErr("സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  async function publish() {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!confirm(`വാർഡ് ${alert.ward}-ലേക്ക് ഈ അറിയിപ്പ് പ്രസിദ്ധീകരിക്കണോ?\nPublish this alert for Ward ${alert.ward}?`)) {
      inFlight.current = false;
      return;
    }
    setBusy("publish");
    setErr("");
    setMsg("");
    try {
      const res = await adminFetch(`/api/alerts/${alert.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ body_ml: text }),
      });
      if (res.status === 409) {
        setErr("ഈ അറിയിപ്പ് ഇതിനകം പ്രസിദ്ധീകരിച്ചു.");
        await onChanged();
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { taskTitle: string };
      setMsg(`പ്രസിദ്ധീകരിച്ചു. ടാസ്ക് ഉണ്ടാക്കി: "${json.taskTitle}"`);
      await onChanged();
    } catch (e) {
      console.error("publish failed", e);
      setErr("പ്രസിദ്ധീകരിക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  return (
    <div className="card space-y-3 border-alert/40">
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold">വാർഡ് {alert.ward}</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
          കരട് / Draft
        </span>
      </div>
      <textarea
        className="field min-h-[420px] whitespace-pre-wrap leading-relaxed"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy !== null}
        maxLength={4000}
      />
      {err && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">
          {err}
          <span className="label-en">Something went wrong.</span>
        </p>
      )}
      {msg && <p className="rounded-xl bg-teal-50 p-3 text-primary">{msg}</p>}
      <div className="grid gap-2">
        <button
          className="btn-primary flex-col gap-0 py-2"
          onClick={publish}
          disabled={busy !== null || !text.trim()}
        >
          {busy === "publish" ? "പ്രസിദ്ധീകരിക്കുന്നു…" : "അംഗീകരിച്ച് പ്രസിദ്ധീകരിക്കുക"}
          <span className="text-sm font-normal text-teal-100">Approve and publish</span>
        </button>
        <button
          className="btn-outline flex-col gap-0 py-2"
          onClick={save}
          disabled={busy !== null || !dirty || !text.trim()}
        >
          {busy === "save" ? "സേവ് ചെയ്യുന്നു…" : "കരട് സേവ് ചെയ്യുക"}
          <span className="text-sm font-normal">Save draft</span>
        </button>
      </div>
    </div>
  );
}
