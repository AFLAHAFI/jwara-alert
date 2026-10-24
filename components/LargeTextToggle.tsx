"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

export default function LargeTextToggle({ initialLarge }: { initialLarge: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [large, setLarge] = useState(initialLarge);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !large;
    setBusy(true);
    try {
      const res = await fetch("/api/me/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ large_text: next }),
      });
      if (res.ok) {
        setLarge(next);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="btn-ghost flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      aria-pressed={large}
    >
      <span className="font-bold text-base">A<span className="text-xl">A</span></span>
      <span>{large ? t.normal_text : t.large_text}</span>
    </button>
  );
}
