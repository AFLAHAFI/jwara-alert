import en, { type Dict, type DictKey } from "@/lib/i18n/en";
import ml from "@/lib/i18n/ml";
import hi from "@/lib/i18n/hi";

export type { Dict, DictKey };

export const LANGS = ["ml", "en", "hi"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "ml";
export const LANG_COOKIE = "jwara_lang";

/** Each language's own name, shown in the switcher. */
export const LANG_LABEL: Record<Lang, string> = { ml: "മലയാളം", en: "English", hi: "हिन्दी" };
export const LOCALE: Record<Lang, string> = { ml: "ml-IN", en: "en-IN", hi: "hi-IN" };

export const DICTS: Record<Lang, Dict> = { ml, en, hi };

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}

/** Replaces {name} placeholders. */
export function fmt(s: string, vars: Record<string, string | number> = {}): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

type Named = { name_en: string; name_ml: string; name_hi?: string | null };

/** Place or illness name in the chosen language, falling back to Malayalam, then English. */
export function pickName(row: Named | null | undefined, lang: Lang): string {
  if (!row) return "";
  if (lang === "en") return row.name_en;
  if (lang === "hi") return row.name_hi || row.name_ml || row.name_en;
  return row.name_ml || row.name_en;
}

type Bodies = { body_ml: string; body_en?: string | null; body_hi?: string | null };

/** Alert text in the chosen language; Malayalam when that language was not sent. */
export function pickBody(a: Bodies, lang: Lang): { text: string; fallback: boolean } {
  const v = lang === "en" ? a.body_en : lang === "hi" ? a.body_hi : a.body_ml;
  if (v && v.trim()) return { text: v, fallback: false };
  return { text: a.body_ml, fallback: lang !== "ml" };
}

const TZ = "Asia/Kolkata";

export function formatDateTime(iso: string | Date, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(typeof iso === "string" ? new Date(iso) : iso);
}

/** For YYYY-MM-DD dates (no time zone shift). */
export function formatDay(day: string, lang: Lang): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], { timeZone: "UTC", day: "numeric", month: "short" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
