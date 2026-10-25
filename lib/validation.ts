export const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72; // bcrypt only uses the first 72 bytes
/** bcrypt work factor for new password hashes (each +1 doubles the cost of guessing). */
export const BCRYPT_COST = 12;

// Passwords that appear at the top of every leaked-password list (checked case-insensitively,
// also with trailing digits removed: "password123" counts as "password").
const COMMON = new Set([
  "password", "passw0rd", "qwerty", "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbnm", "letmein", "welcome",
  "admin", "administrator", "iloveyou", "monkey", "dragon", "football", "cricket", "baseball", "sunshine",
  "princess", "abc", "abcd", "abcdef", "abcdefgh", "test", "guest", "login", "master", "secret", "india",
  "kerala", "jwara", "jwaraalert", "asha", "doctor", "health", "user", "changeme",
]);
const ALL_SAME = /^(.)\1+$/;
const SEQUENCES = ["0123456789", "9876543210", "abcdefghijklmnopqrstuvwxyz", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

/**
 * Rules for a NEW password (sign-up, new ASHA, new elder). Login does not use this, so older
 * accounts keep working. Returns the i18n key of the problem, or null when the password is fine.
 */
export function passwordProblem(
  v: unknown,
  username = "",
): null | "err_password" | "err_password_simple" | "err_password_common" | "err_password_username" {
  if (typeof v !== "string" || v.length < MIN_PASSWORD || Buffer.byteLength(v) > MAX_PASSWORD) return "err_password";
  if (!/[A-Za-z\u0080-\uFFFF]/.test(v) || !/[0-9]/.test(v)) return "err_password_simple";
  const low = v.toLowerCase();
  const core = low.replace(/[0-9!@#$%^&*._-]+$/, "").replace(/^[0-9!@#$%^&*._-]+/, "");
  if (COMMON.has(low) || COMMON.has(core) || ALL_SAME.test(low) || ALL_SAME.test(core)) return "err_password_common";
  if (SEQUENCES.some((seq) => seq.includes(low) || (core.length >= 4 && seq.includes(core)))) return "err_password_common";
  const u = username.trim().toLowerCase();
  if (u.length >= 3 && (low.includes(u) || (u.includes(core) && core.length >= 4))) return "err_password_username";
  return null;
}

export function normalizeUsername(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

export function cleanName(v: unknown): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
}

export function isValidName(v: string): boolean {
  return v.length >= 1 && v.length <= 80;
}


export function isId(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v > 0;
}
