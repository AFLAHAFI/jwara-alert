"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PinGate, { adminFetch, clearStoredPin } from "@/components/PinGate";
import { formatKolkata } from "@/lib/time";

type Task = {
  id: string;
  alert_id: string;
  ward: number;
  title: string;
  done: boolean;
  created_at: string;
};

function TasksInner() {
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
      setError("ടാസ്കുകൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(task: Task) {
    if (busy.has(task.id)) return;
    setBusy((b) => new Set(b).add(task.id));
    setError("");
    const next = !task.done;
    setTasks((ts) => ts?.map((t) => (t.id === task.id ? { ...t, done: next } : t)) ?? null);
    try {
      const res = await adminFetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error("task update failed", err);
      setTasks((ts) => ts?.map((t) => (t.id === task.id ? { ...t, done: task.done } : t)) ?? null);
      setError("മാറ്റം സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല.");
    } finally {
      setBusy((b) => {
        const n = new Set(b);
        n.delete(task.id);
        return n;
      });
    }
  }

  const open = tasks?.filter((t) => !t.done) ?? [];
  const done = tasks?.filter((t) => t.done) ?? [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">
        ടാസ്കുകൾ
        <span className="label-en">
          Follow-up tasks created when an alert is published
          {tasks && ` — ${open.length} open, ${done.length} done`}
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

      {!tasks && !error && <p className="text-center text-slate-500">ലോഡ് ചെയ്യുന്നു…</p>}

      {tasks && tasks.length === 0 && (
        <p className="card text-center text-slate-600">
          ടാസ്കുകൾ ഒന്നുമില്ല.
          <span className="label-en">No tasks yet. Publish an alert to create one.</span>
        </p>
      )}

      {[...open, ...done].map((t) => (
        <label
          key={t.id}
          className={`card flex min-h-btn cursor-pointer items-center gap-4 ${t.done ? "opacity-60" : ""}`}
        >
          <input
            type="checkbox"
            className="h-7 w-7 shrink-0 accent-primary"
            checked={t.done}
            disabled={busy.has(t.id)}
            onChange={() => toggle(t)}
            aria-label={`Mark "${t.title}" ${t.done ? "not done" : "done"}`}
          />
          <span className="min-w-0 flex-1">
            <span className={`block text-lg font-semibold ${t.done ? "line-through" : ""}`}>
              വാർഡ് {t.ward} വീടുകൾ സന്ദർശിക്കുക
            </span>
            <span className="label-en">
              {t.title} · {formatKolkata(t.created_at)} IST
            </span>
          </span>
        </label>
      ))}

      <p className="text-center text-sm text-slate-500">
        മാതൃകാ ഡാറ്റ · Example data only ·{" "}
        <Link href="/dashboard" className="underline">
          Dashboard
        </Link>{" "}
        ·{" "}
        <Link href="/alerts" className="underline">
          Alerts
        </Link>
      </p>
    </div>
  );
}

export default function TasksPage() {
  return <PinGate>{() => <TasksInner />}</PinGate>;
}
