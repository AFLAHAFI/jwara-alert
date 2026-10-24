"use client";

import { useApi } from "@/components/useApi";

export default function TaskDoneButton({ id, done }: { id: string; done: boolean }) {
  const { busy, error, call } = useApi();
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => call(`/api/asha/tasks/${id}`, "PATCH", { done: !done })}
        className={done ? "btn-outline text-base" : "btn-primary flex-col gap-0 py-2"}
      >
        {busy ? "…" : done ? "വീണ്ടും തുറക്കുക · Mark not done" : "സന്ദർശനം കഴിഞ്ഞു"}
        {!done && !busy && <span className="text-sm font-normal text-teal-100">Mark visit done</span>}
      </button>
      {error && <p role="alert" className="mt-1 text-sm text-alert">{error}</p>}
    </div>
  );
}
