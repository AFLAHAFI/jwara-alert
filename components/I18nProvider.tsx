"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dict, Lang } from "@/lib/i18n";

const Ctx = createContext<{ lang: Lang; t: Dict } | null>(null);

export function I18nProvider({ lang, t, children }: { lang: Lang; t: Dict; children: ReactNode }) {
  return <Ctx.Provider value={{ lang, t }}>{children}</Ctx.Provider>;
}

/** Text and language for interactive (client) components. */
export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
