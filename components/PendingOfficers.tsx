"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { pickName } from "@/lib/i18n";

type Named = { name_en: string; name_ml: string; name_hi: string | null };
type Officer = {
  id: string;
  username: string;
  display_name: string;
  designation: string | null;
  created_at: string;
  districts: Named | null;
  panchayats: Named | null;
};

export default function PendingOfficers() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [list, setList] = useState<Officer[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/officers?status=pending");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? t.loadError);
      setList(j.officers);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadError);
    }
  }, [t]);

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
        setError(j.error ?? t.genericError);
      }
    } catch {
      setError(t.networkError);
    } finally {
      setBusyId("");
      await load();
      router.refresh();
    }
  }

  if (error)
    return (
      <p role="alert" className="err-box">
        {error}
      </p>
    );
  if (!list) return <div className="skeleton h-24" aria-label={t.loading} />;
  if (list.length === 0)
    return (
      <p className="flex items-center gap-2 text-slate-600">
        <Icon name="check" className="h-5 w-5 text-primary" />
        {t.no_pending}
      </p>
    );

  return (
    <ul className="space-y-3">
      {list.map((o) => (
        <li key={o.id} className="rounded-xl border border-slate-200 p-3">
          <p className="font-semibold">{o.display_name}</p>
          <p className="text-sm text-slate-600">
            {o.designation} · {pickName(o.panchayats, lang)}, {pickName(o.districts, lang)}
          </p>
          <p className="text-xs text-slate-500">@{o.username}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-primary btn-sm" disabled={busyId === o.id} onClick={() => act(o.id, "approve")}>
              {t.approve}
            </button>
            <button className="btn-ghost btn-sm" disabled={busyId === o.id} onClick={() => act(o.id, "reject")}>
              {t.reject}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
