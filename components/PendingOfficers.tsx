"use client";

import { useCallback, useEffect, useState } from "react";

type Officer = {
  id: string;
  username: string;
  display_name: string;
  designation: string | null;
  created_at: string;
  districts: { name_en: string; name_ml: string } | null;
  panchayats: { name_en: string; name_ml: string } | null;
};

export default function PendingOfficers() {
  const [list, setList] = useState<Officer[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/officers?status=pending");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "failed");
      setList(j.officers);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject") {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/officers/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Failed");
      }
    } finally {
      setBusyId("");
      load();
    }
  }

  if (error) return <p role="alert" className="text-red-700">{error}</p>;
  if (!list) return <p className="text-slate-500">ലോഡ് ചെയ്യുന്നു… Loading…</p>;
  if (list.length === 0)
    return (
      <p className="text-slate-600">
        അംഗീകാരത്തിന് കാത്തിരിക്കുന്നവർ ഇല്ല.
        <span className="label-en">No officers waiting for approval.</span>
      </p>
    );

  return (
    <ul className="space-y-3">
      {list.map((o) => (
        <li key={o.id} className="rounded-xl border border-slate-200 p-3">
          <p className="font-semibold">{o.display_name}</p>
          <p className="text-sm text-slate-600">
            {o.designation} · {o.panchayats?.name_en}, {o.districts?.name_en}
          </p>
          <p className="text-xs text-slate-500">@{o.username}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-primary" disabled={busyId === o.id} onClick={() => act(o.id, "approve")}>
              അംഗീകരിക്കുക · Approve
            </button>
            <button className="btn-outline" disabled={busyId === o.id} onClick={() => act(o.id, "reject")}>
              നിരസിക്കുക · Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
