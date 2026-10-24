export const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;
export const MIN_PASSWORD = 6;
export const MAX_PASSWORD = 72; // bcrypt only uses the first 72 bytes

export function normalizeUsername(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

export function cleanName(v: unknown): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
}

export function isValidName(v: string): boolean {
  return v.length >= 1 && v.length <= 80;
}

export function isValidPassword(v: unknown): v is string {
  return typeof v === "string" && v.length >= MIN_PASSWORD && Buffer.byteLength(v) <= MAX_PASSWORD;
}

export function isId(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v > 0;
}
