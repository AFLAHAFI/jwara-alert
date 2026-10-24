"use client";

import { useApi } from "@/components/useApi";

export default function AshaToggle({ id, disabled }: { id: string; disabled: boolean }) {
  const { busy, error, call } = useApi();
  return (
    <div className="text-right">
      <button
        type="button"
        disabled={busy}
        onClick={() => call(`/api/officer/ashas/${id}`, "POST", { disabled: !disabled })}
        className={`rounded-xl border-2 px-3 py-1 text-sm font-semibold ${
          disabled ? "border-primary text-primary" : "border-slate-300 text-slate-600"
        }`}
      >
        {busy ? "…" : disabled ? "ഓൺ ആക്കുക · Enable" : "ഓഫ് ആക്കുക · Disable"}
      </button>
      {error && <p className="text-xs text-alert">{error}</p>}
    </div>
  );
}
