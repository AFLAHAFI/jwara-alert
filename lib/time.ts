const TZ = "Asia/Kolkata";

const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
});

export function formatKolkata(iso: string | Date): string {
  return dateTimeFmt.format(typeof iso === "string" ? new Date(iso) : iso);
}

export function formatKolkataDate(iso: string | Date): string {
  return dateFmt.format(typeof iso === "string" ? new Date(iso) : iso);
}

/** Start of the Asia/Kolkata calendar day, `daysAgo` days before today, as a UTC Date. */
export function startOfKolkataDay(daysAgo = 0): Date {
  const now = new Date();
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() - daysAgo);
  return new Date(local.getTime() - offsetMs);
}
