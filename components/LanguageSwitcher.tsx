"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { lang, t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(next: Lang) {
    if (next === lang || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/lang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      // Cookie fallback so the switch still works if the request failed.
      document.cookie = `jwara_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    }
    router.refresh();
    setBusy(false);
  }

  return (
    <label className="flex items-center gap-1 rounded-xl bg-primary-dark/60 px-2 py-1 text-white focus-within:ring-2 focus-within:ring-white">
      <Icon name="globe" className="h-4 w-4 shrink-0" />
      <span className="sr-only">{t.language}</span>
      <select
        value={lang}
        disabled={busy}
        onChange={(e) => change(e.target.value as Lang)}
        className="cursor-pointer bg-transparent py-1 pr-1 text-sm font-semibold outline-none [&>option]:text-ink"
      >
        {LANGS.map((l) => (
          <option key={l} value={l} lang={l}>
            {LANG_LABEL[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
