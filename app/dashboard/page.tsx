"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PinGate, { adminFetch, clearStoredPin } from "@/components/PinGate";
import BarChart from "@/components/BarChart";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";
import { RED_THRESHOLD, WINDOW_DAYS, isRedWard, type WardCount } from "@/lib/redLogic";

type Dashboard = {
  since: string;
  wards: WardCount[];
  redWards: number[];
  openDrafts: { id: string; ward: number; status: "draft" }[];
};

function DashboardInner() {
  const { t } = useI18n();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await adminFetch("/api/dashboard");
      if (res.status === 401) {
        clearStoredPin();
        location.reload();
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as Dashboard);
    } catch (err) {
      console.error("dashboard load failed", err);
      setError(t.loadError);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function createAlert(ward: number) {
    if (creating !== null) return;
    setCreating(ward);
    setNotice("");
    try {
      const res = await adminFetch("/api/alerts", {
        method: "POST",
        body: JSON.stringify({ ward }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNotice(fmt(t.legacy_draft_created, { n: ward }));
      await load();
    } catch (err) {
      console.error("create alert failed", err);
      setError(t.genericError);
    } finally {
      setCreating(null);
    }
  }

  const draftFor = (ward: number) =>
    data?.openDrafts.find((a) => a.ward === ward);

  return (
    <div className="narrow space-y-5">
      <div>
        <h1 className="page-title">{t.legacy_dash_title}</h1>
        <p className="text-slate-600">{fmt(t.legacy_dash_sub, { n: WINDOW_DAYS })}</p>
      </div>

      {error && (
        <div role="alert" className="err-box">
          {error}
          <button className="mt-2 block font-semibold underline" onClick={load}>
            {t.retry}
          </button>
        </div>
      )}

      {!data && !error && <div className="skeleton h-80" aria-label={t.loading} />}

      {data && (
        <>
          <section className="card">
            <BarChart
              rows={data.wards.map((w) => ({ key: w.ward, label: fmt(t.wardN, { n: w.ward }), count: w.count, red: isRedWard(w.count) }))}
              caption={fmt(t.red_line, { n: RED_THRESHOLD })}
            />
          </section>

          <section className="space-y-3">
            <h2 className={`section-title ${data.redWards.length ? "text-alert" : "text-primary"}`}>
              <Icon name={data.redWards.length ? "alert" : "check"} />
              {data.redWards.length ? fmt(t.legacy_red_count, { n: data.redWards.length }) : t.legacy_red_none}
            </h2>
            <p className="text-sm text-slate-500">{fmt(t.legacy_rule, { n: RED_THRESHOLD, d: WINDOW_DAYS })}</p>
            {notice && (
              <p role="status" className="ok-box">
                {notice}
              </p>
            )}
            {data.redWards.map((ward) => {
              const count = data.wards.find((w) => w.ward === ward)?.count ?? 0;
              const draft = draftFor(ward);
              return (
                <div key={ward} className="card space-y-3 border-alert/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-alert">{fmt(t.wardN, { n: ward })}</span>
                    <span className="chip bg-alert text-white">{fmt(t.legacy_reports, { n: count })}</span>
                  </div>
                  {draft ? (
                    <Link href="/alerts" className="btn-outline btn-sm">
                      {t.legacy_draft_ready}
                    </Link>
                  ) : (
                    <button className="btn-danger btn-sm" disabled={creating !== null} onClick={() => createAlert(ward)}>
                      {creating === ward ? t.creating : t.create_alert}
                    </button>
                  )}
                </div>
              );
            })}
          </section>

          <p className="flex justify-center gap-3 text-sm text-slate-500">
            <Link href="/tasks" className="underline">
              {t.nav_tasks}
            </Link>
            <Link href="/alerts" className="underline">
              {t.nav_alerts}
            </Link>
            <button
              className="underline"
              onClick={() => {
                clearStoredPin();
                location.reload();
              }}
            >
              {t.pin_lock}
            </button>
          </p>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <PinGate>{() => <DashboardInner />}</PinGate>;
}
