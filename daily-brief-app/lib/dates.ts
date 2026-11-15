// Brisbane is UTC+10 all year (no daylight saving).
const OFFSET_MS = 10 * 60 * 60 * 1000;

export function brisbaneToday(now = new Date()): string {
  return new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

export function isDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function prettyDate(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function shortDate(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
}
