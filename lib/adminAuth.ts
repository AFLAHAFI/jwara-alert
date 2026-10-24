import "server-only";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const ADMIN_PIN_HEADER = "x-admin-pin";

export function isValidAdminPin(pin: string | null | undefined): boolean {
  const expected = process.env.ADMIN_PIN;
  if (!expected || !pin) return false;
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Returns a 401 response when the request lacks a valid admin PIN, else null. */
export function requireAdmin(req: Request): NextResponse | null {
  if (isValidAdminPin(req.headers.get(ADMIN_PIN_HEADER))) return null;
  return NextResponse.json({ error: "Admin PIN required" }, { status: 401 });
}
