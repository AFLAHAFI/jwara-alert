export const WARDS = Array.from({ length: 10 }, (_, i) => i + 1);

export const MIN_WARD = 1;
export const MAX_WARD = 10;

/** One fever report per phone per 10 minutes. */
export const REPORT_COOLDOWN_MS = 10 * 60 * 1000;

export const REPORT_COOKIE = "jwara_last_report";
export const REPORT_STORAGE_KEY = "jwara:lastReportAt";

export function isValidWard(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_WARD &&
    value <= MAX_WARD
  );
}
