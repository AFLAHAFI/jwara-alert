import { MAX_ALERT_BODY } from "@/lib/alertTemplate";

export type Bodies = { body_ml: string; body_en: string | null; body_hi: string | null };

function clean(v: unknown, required: boolean): string | null | false {
  if (v === undefined || v === null || v === "") return required ? false : null;
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return required ? false : null;
  if (s.length > MAX_ALERT_BODY) return false;
  return s;
}

/**
 * Reads { ml, en?, hi? } alert texts. Malayalam is required (it is the fallback for everyone);
 * English and Hindi are optional. Returns null when anything is invalid.
 */
export function parseBodies(input: unknown): Bodies | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const o = input as Record<string, unknown>;
  const ml = clean(o.ml, true);
  const en = clean(o.en, false);
  const hi = clean(o.hi, false);
  if (ml === false || ml === null || en === false || hi === false) return null;
  return { body_ml: ml, body_en: en, body_hi: hi };
}
