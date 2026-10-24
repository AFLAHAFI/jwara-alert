"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PinGate, { adminFetch, clearStoredPin } from "@/components/PinGate";
import WardBarChart from "@/components/WardBarChart";
import { RED_THRESHOLD, WINDOW_DAYS, type WardCount } from "@/lib/redLogic";
import { formatKolkata } from "@/lib/time";

type Dashboard = {
  since: string;
  wards: WardCount[];
  redWards: number[];
  openDrafts: { id: string; ward: number; status: "draft" }[];
};

function DashboardInner() {
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
      setError("ഡാറ്റ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല.");
    }
  }, []);

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
      setNotice(`വാർഡ് ${ward}-ന് കരട് അറിയിപ്പ് തയ്യാറായി. / Draft alert for Ward ${ward} created.`);
      await load();
    } catch (err) {
      console.error("create alert failed", err);
      setError("അറിയിപ്പ് ഉണ്ടാക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.");
    } finally {
      setCreating(null);
    }
  }

  const draftFor = (ward: number) =>
    data?.openDrafts.find((a) => a.ward === ward);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">
        ഡാഷ്‌ബോർഡ്
        <span className="label-en">
          Reports per ward, last {WINDOW_DAYS} days
          {data && ` (since ${formatKolkata(data.since)} IST)`}
        </span>
      </h1>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">
          {error}
          <span className="label-en">Something went wrong. Please retry.</span>
          <button className="mt-2 block underline" onClick={load}>
            വീണ്ടും ശ്രമിക്കുക / Retry
          </button>
        </p>
      )}

      {!data && !error && <p className="text-center text-slate-500">ലോഡ് ചെയ്യുന്നു…</p>}

      {data && (
        <>
          <section className="card">
            <WardBarChart wards={data.wards} />
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">
              {data.redWards.length > 0 ? (
                <span className="text-alert">
                  ചുവപ്പ് വാർഡുകൾ ({data.redWards.length})
                </span>
              ) : (
                <span className="text-primary">ചുവപ്പ് വാർഡുകൾ ഇല്ല</span>
              )}
              <span className="label-en">
                RED = {RED_THRESHOLD}+ reports in {WINDOW_DAYS} days
                {data.redWards.length === 0 && " — none right now"}
              </span>
            </h2>
            {notice && <p className="rounded-xl bg-teal-50 p-3 text-primary">{notice}</p>}
            {data.redWards.map((ward) => {
              const count = data.wards.find((w) => w.ward === ward)?.count ?? 0;
              const draft = draftFor(ward);
              return (
                <div key={ward} className="card border-alert/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-alert">വാർഡ് {ward}</span>
                    <span className="rounded-full bg-alert px-3 py-1 text-sm font-semibold text-white">
                      {count} reports
                    </span>
                  </div>
                  {draft ? (
                    <Link href="/alerts" className="btn-outline mt-3 flex-col gap-0 py-2">
                      കരട് അറിയിപ്പ് തയ്യാറാണ് — കാണുക
                      <span className="text-sm font-normal">Draft ready — open in Alerts</span>
                    </Link>
                  ) : (
                    <button
                      className="btn-danger mt-3 flex-col gap-0 py-2"
                      disabled={creating !== null}
                      onClick={() => createAlert(ward)}
                    >
                      {creating === ward ? "തയ്യാറാക്കുന്നു…" : "അറിയിപ്പ് ഉണ്ടാക്കുക"}
                      <span className="text-sm font-normal text-red-100">Create alert</span>
                    </button>
                  )}
                </div>
              );
            })}
          </section>

          <p className="text-center text-sm text-slate-500">
            മാതൃകാ ഡാറ്റ · Example data only ·{" "}
            <Link href="/tasks" className="underline">
              Tasks
            </Link>{" "}
            ·{" "}
            <button
              className="underline"
              onClick={() => {
                clearStoredPin();
                location.reload();
              }}
            >
              Lock
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
