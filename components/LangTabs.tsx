"use client";

import { LANG_LABEL, type Lang } from "@/lib/i18n";

/** Tabs to switch which language's alert text is being edited. */
export default function LangTabs({
  langs,
  active,
  onPick,
  filled,
}: {
  langs: Lang[];
  active: Lang;
  onPick: (l: Lang) => void;
  filled?: Partial<Record<Lang, boolean>>;
}) {
  return (
    <div role="tablist" className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={active === l}
          onClick={() => onPick(l)}
          className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold ${
            active === l ? "bg-white text-primary shadow-sm" : "text-slate-600"
          }`}
        >
          {LANG_LABEL[l]}
          {filled && filled[l] === false ? " ○" : ""}
        </button>
      ))}
    </div>
  );
}
