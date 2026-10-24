"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PinGate, { adminFetch, clearStoredPin } from "@/components/PinGate";
import { useI18n } from "@/components/I18nProvider";
import { fmt, formatDateTime } from "@/lib/i18n";

type Task = {
  id: string;
  alert_id: string;
  ward: number;
  title: string;
  done: boolean;
  created_at: string;
};

function TasksInner() {
  const { t, lang } = useI18n();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await adminFetch("/api/tasks");
      if (res.status === 401) {
        clearStoredPin();
        location.reload();
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTasks(((await res.json()) as { tasks: Task[] }).tasks);
    } catch (err) {
      console.error("tasks load failed", err);
      setError(t.loadError);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(task: Task) {
    if (busy.has(task.id)) return;
    setBusy((b) => new Set(b).add(task.id));
    setError("");
    const next = !task.done;
    setTasks((ts) => ts?.map((x) => (x.id === task.id ? { ...x, done: next } : x)) ?? null);
    try {
      const res = await adminFetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error("task update failed", err);
      setTasks((ts) => ts?.map((x) => (x.id === task.id ? { ...x, done: task.done } : x)) ?? null);
      setError(t.err_save);
    } finally {
      setBusy((b) => {
        const n = new Set(b);
        n.delete(task.id);
        return n;
      });
    }
  }

  const open = tasks?.filter((x) => !x.done) ?? [];
  const done = tasks?.filter((x) => x.done) ?? [];

  return (
    <div className="narrow space-y-5">
      <div>
        <h1 className="page-title">{t.legacy_tasks_title}</h1>
        {tasks && <p className="text-slate-600">{fmt(t.legacy_tasks_sub, { open: open.length, done: done.length })}</p>}
      </div>

      {error && (
        <div role="alert" className="err-box">
          {error}
          <button className="mt-2 block font-semibold underline" onClick={load}>
            {t.retry}
          </button>
        </div>
      )}

      {!tasks && !error && <div className="skeleton h-40" aria-label={t.loading} />}

      {tasks && tasks.length === 0 && <p className="card text-center text-slate-600">{t.legacy_no_tasks}</p>}

      {[...open, ...done].map((x) => (
        <label key={x.id} className={`card flex min-h-btn cursor-pointer items-center gap-4 ${x.done ? "opacity-60" : ""}`}>
          <input
            type="checkbox"
            className="h-7 w-7 shrink-0 accent-primary"
            checked={x.done}
            disabled={busy.has(x.id)}
            onChange={() => toggle(x)}
            aria-label={x.done ? t.mark_not_done : t.mark_done}
          />
          <span className="min-w-0 flex-1">
            <span className={`block text-lg font-semibold ${x.done ? "line-through" : ""}`}>
              {fmt(t.legacy_task_title, { n: x.ward })}
            </span>
            <span className="block text-sm text-slate-500">{formatDateTime(x.created_at, lang)}</span>
          </span>
        </label>
      ))}

      <p className="flex justify-center gap-3 text-sm text-slate-500">
        <Link href="/dashboard" className="underline">
          {t.nav_dashboard}
        </Link>
        <Link href="/alerts" className="underline">
          {t.nav_alerts}
        </Link>
      </p>
    </div>
  );
}

export default function TasksPage() {
  return <PinGate>{() => <TasksInner />}</PinGate>;
}
