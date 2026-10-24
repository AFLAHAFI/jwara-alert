"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { useApi } from "@/components/useApi";

/** Two-tap remove (no browser dialog): first tap asks, second tap removes. */
export default function FacilityRemove({ id }: { id: number }) {
  const { t } = useI18n();
  const [ask, setAsk] = useState(false);
  const { busy, error, call } = useApi();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        className={`min-h-[40px] rounded-xl px-3 text-sm font-semibold ${ask ? "bg-red-600 text-white" : "text-red-700 hover:bg-red-50"}`}
        onClick={async () => {
          if (!ask) return setAsk(true);
          const ok = await call(`/api/officer/facilities?id=${id}`, "DELETE");
          if (!ok) setAsk(false);
        }}
        onBlur={() => !busy && setAsk(false)}
      >
        {busy ? t.pleaseWait : ask ? t.fac_remove_sure : t.fac_remove}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
