import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  const s = process.env.REPORT_COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("REPORT_COOKIE_SECRET / SUPABASE_SERVICE_ROLE_KEY not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** `${timestampMs}.${hmac}` so the client cannot rewind the cooldown by editing the cookie. */
export function encodeReportCookie(ts: number): string {
  const payload = String(ts);
  return `${payload}.${sign(payload)}`;
}

/** Returns the signed timestamp, or null when the cookie is missing or tampered with. */
export function decodeReportCookie(value: string | undefined): number | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const sig = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(payload));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  const ts = Number(payload);
  return Number.isFinite(ts) && ts > 0 ? ts : null;
}
