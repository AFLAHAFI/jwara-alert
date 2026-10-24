"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PinGate, { adminFetch, clearStoredPin } from "@/components/PinGate";
import { formatKolkata } from "@/lib/time";

type Task = { id: string; ward: number; title: string; done: boolean; created_at: string };

function TasksInner() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

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
      setError("ടാസ്കുകൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല. / Could not load tasks.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(t: Task) {
    if (busyId) return;
    setBusyId(t.id);
    try {
      const res = await adminFetch(`/api/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ done: !t.done }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (err) {
      console.error("task update failed", err);
      setError("മാറ്റം സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല. / Could not save change.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        ആശാ പ്രവർത്തകരുടെ സന്ദർശനങ്ങൾ
        <span className="label-en">ASHA visit tasks</span>
      </h1>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-alert">
          {error}
        </p>
      )}
      {!tasks && !error && <p className="text-center text-slate-500">ലോഡ് ചെയ്യുന്നു…</p>}
      {tasks && tasks.length === 0 && (
        <p className="card text-center text-slate-600">
          ടാസ്കുകൾ ഒന്നുമില്ല. ഒരു അറിയിപ്പ് പ്രസിദ്ധീകരിക്കുമ്പോൾ ടാസ്ക് ഉണ്ടാകും.
          <span className="label-en">No tasks yet. Publishing an alert creates one.</span>
        </p>
      )}
      {tasks?.map((t) => (
        <label
          key={t.id}
          className={`card flex min-h-btn cursor-pointer items-center gap-4 ${t.done ? "opacity-60" : ""}`}
        >
          <input
            type="checkbox"
            className="h-7 w-7 shrink-0 accent-teal-700"
            checked={t.done}
            disabled={busyId !== null}
            onChange={() => toggle(t)}
          />
          <span className="min-w-0">
            <span className={`block text-lg font-semibold ${t.done ? "line-through" : ""}`}>
              വാർഡ് {t.ward} വീടുകൾ സന്ദർശിക്കുക
            </span>
            <span className="label-en">
              {t.title} · {formatKolkata(t.created_at)} IST
            </span>
          </span>
        </label>
      ))}
      <Link href="/dashboard" className="block text-center text-sm underline">
        ← Dashboard
      </Link>
    </div>
  );
}

export default function TasksPage() {
  return <PinGate>{() => <TasksInner />}</PinGate>;
}
