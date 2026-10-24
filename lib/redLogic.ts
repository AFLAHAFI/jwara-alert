/** A ward is RED when it has at least this many reports in the window. */
export const RED_THRESHOLD = 5;
/** Window (days) used for both the dashboard chart and the red rule. */
export const WINDOW_DAYS = 3;

export type WardCount = { ward: number; count: number };

export function isRedWard(count: number): boolean {
  return count >= RED_THRESHOLD;
}

export function windowStart(now = new Date()): Date {
  return new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
}
