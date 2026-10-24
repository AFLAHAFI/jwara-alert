"use client";

import { useI18n } from "@/components/I18nProvider";
import { useApi } from "@/components/useApi";

/** Switches an account off/on. `endpoint` is the POST route; the body is built by `body`. */
export default function AccountToggle({
  endpoint,
  disabled,
  kind = "asha",
}: {
  endpoint: string;
  disabled: boolean;
  kind?: "asha" | "officer";
}) {
  const { t } = useI18n();
  const { busy, error, call } = useApi();
  const body = kind === "asha" ? { disabled: !disabled } : { action: disabled ? "enable" : "disable" };
  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        disabled={busy}
        onClick={() => call(endpoint, "POST", body)}
        className={`min-h-[40px] rounded-xl border-2 px-3 text-sm font-semibold ${
          disabled ? "border-primary text-primary" : "border-slate-300 text-slate-600"
        }`}
      >
        {busy ? "…" : disabled ? t.switch_on : t.switch_off}
      </button>
      {error && <p className="mt-1 text-xs text-alert">{error}</p>}
    </div>
  );
}
