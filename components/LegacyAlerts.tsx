"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { adminFetch, getStoredPin } from "@/components/PinGate";
import Icon from "@/components/Icon";
import ShareWhatsApp from "@/components/ShareWhatsApp";
import { useI18n } from "@/components/I18nProvider";
import { fmt, formatDateTime } from "@/lib/i18n";

type Alert = {
  id: string;
  ward: number;
  body_ml: string;
  status: "draft" | "published";
  created_at: string;
  published_at: string | null;
};

export default function LegacyAlerts() {
  const { t, lang } = useI18n();
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
      setError(t.loadError);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const drafts = alerts?.filter((a) => a.status === "draft") ?? [];
  const published = alerts?.filter((a) => a.status === "published") ?? [];

  return (
    <div className="narrow space-y-5">
      <h1 className="page-title">{t.alerts_title_public}</h1>

      {error && (
        <div role="alert" className="err-box">
          {error}
          <button className="mt-2 block font-semibold underline" onClick={load}>
            {t.retry}
          </button>
        </div>
      )}

      {!alerts && !error && (
        <div className="space-y-3" aria-busy="true">
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
        </div>
      )}

      {admin && drafts.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title text-amber-800">{fmt(t.legacy_drafts, { n: drafts.length })}</h2>
          {drafts.map((a) => (
            <DraftEditor key={a.id} alert={a} onChanged={load} />
          ))}
        </section>
      )}

      {alerts && published.length === 0 && (
        <div className="card space-y-2 text-center text-slate-600">
          <Icon name="bell" className="mx-auto h-10 w-10 text-slate-300" />
          <p>{t.no_alerts}</p>
        </div>
      )}

      {published.map((a) => (
        <article key={a.id} className="card space-y-3 border-l-4 border-l-alert">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <span className="chip bg-red-50 text-alert">
              <Icon name="pin" className="h-4 w-4" />
              {fmt(t.wardN, { n: a.ward })}
            </span>
            <time dateTime={a.published_at ?? a.created_at}>{formatDateTime(a.published_at ?? a.created_at, lang)}</time>
          </div>
          <p lang="ml" className="whitespace-pre-wrap text-lg leading-relaxed">
            {a.body_ml}
          </p>
          {lang !== "ml" && <p className="text-xs text-slate-500">{t.only_ml_note}</p>}
          <ShareWhatsApp text={a.body_ml} url={typeof window === "undefined" ? "" : window.location.origin} t={t} />
        </article>
      ))}

      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="underline">
          {t.login_to_pick_illness}
        </Link>
        {!hasPin && (
          <>
            {" · "}
            <Link href="/dashboard" className="underline">
              {t.legacy_admin_link}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function DraftEditor({ alert, onChanged }: { alert: Alert; onChanged: () => Promise<void> }) {
  const { t } = useI18n();
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
      setMsg(t.saved);
      await onChanged();
    } catch (e) {
      console.error("save draft failed", e);
      setErr(t.err_save);
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  async function publish() {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!confirm(fmt(t.legacy_publish_confirm, { n: alert.ward }))) {
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
        setErr(t.err_already_published);
        await onChanged();
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { taskTitle: string };
      setMsg(fmt(t.legacy_published_task, { title: json.taskTitle }));
      await onChanged();
    } catch (e) {
      console.error("publish failed", e);
      setErr(t.genericError);
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  return (
    <div className="card space-y-3 border-alert/40">
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold">{fmt(t.wardN, { n: alert.ward })}</span>
        <span className="chip bg-amber-100 text-amber-800">{t.draft_badge}</span>
      </div>
      <textarea
        lang="ml"
        className="field min-h-[360px] whitespace-pre-wrap py-3 text-base leading-relaxed"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy !== null}
        maxLength={4000}
      />
      {err && (
        <p role="alert" className="err-box">
          {err}
        </p>
      )}
      {msg && <p className="ok-box">{msg}</p>}
      <div className="grid grid-cols-1 gap-2">
        <button className="btn-primary" onClick={publish} disabled={busy !== null || !text.trim()}>
          {busy === "publish" ? t.publishing : t.publish}
        </button>
        <button className="btn-outline" onClick={save} disabled={busy !== null || !dirty || !text.trim()}>
          {busy === "save" ? t.saving : t.save_draft}
        </button>
      </div>
    </div>
  );
}
