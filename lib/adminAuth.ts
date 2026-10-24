import "server-only";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const ADMIN_PIN_HEADER = "x-admin-pin";

/** Max wrong PINs per client IP in the window; then 429 until the window passes. */
const MAX_FAILURES = 10;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; first: number }>();

function clientKey(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isLockedOut(key: string, now: number): boolean {
  const f = failures.get(key);
  if (!f) return false;
  if (now - f.first > FAILURE_WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return f.count >= MAX_FAILURES;
}

function recordFailure(key: string, now: number) {
  const f = failures.get(key);
  if (!f || now - f.first > FAILURE_WINDOW_MS) failures.set(key, { count: 1, first: now });
  else f.count += 1;
  if (failures.size > 10_000) failures.clear();
}

export function isValidAdminPin(pin: string | null | undefined): boolean {
  const expected = process.env.ADMIN_PIN;
  if (!expected || !pin) return false;
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Returns a 401/429 response when the request lacks a valid admin PIN, else null.
 * Wrong guesses are throttled per IP (in-memory; per serverless instance).
 */
export function requireAdmin(req: Request): NextResponse | null {
  const key = clientKey(req);
  const now = Date.now();
  if (isLockedOut(key, now)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(FAILURE_WINDOW_MS / 1000) } },
    );
  }
  if (isValidAdminPin(req.headers.get(ADMIN_PIN_HEADER))) {
    failures.delete(key);
    return null;
  }
  recordFailure(key, now);
  return NextResponse.json({ error: "Admin PIN required" }, { status: 401 });
}
