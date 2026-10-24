import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LANG, DICTS, LANG_COOKIE, isLang, type Dict, type Lang } from "@/lib/i18n";

/** Language for this request: the cookie set by the switcher (or at login), else Malayalam. */
export const getLang = cache((): Lang => {
  try {
    const v = cookies().get(LANG_COOKIE)?.value;
    return isLang(v) ? v : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
});

export function getT(): { lang: Lang; t: Dict } {
  const lang = getLang();
  return { lang, t: DICTS[lang] };
}

export const LANG_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 365 * 24 * 60 * 60,
};
