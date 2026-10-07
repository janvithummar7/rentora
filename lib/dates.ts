import { formatDate, todayISO } from "@/lib/utils";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export const isISODate = (v: string) => ISO.test(v);

const toUTC = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function addDays(iso: string, n: number): string {
  return fromUTC(toUTC(iso) + n * 86_400_000);
}

/** Every date from start to end inclusive. Returns [] if end < start. */
export function daysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  for (let t = toUTC(start); t <= toUTC(end); t += 86_400_000) out.push(fromUTC(t));
  return out;
}

/** Groups sorted unique dates into consecutive [start, end] ranges. */
export function groupRanges(dates: string[]): [string, string][] {
  const sorted = [...new Set(dates)].sort();
  const ranges: [string, string][] = [];
  for (const d of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && addDays(last[1], 1) === d) last[1] = d;
    else ranges.push([d, d]);
  }
  return ranges;
}

function short(iso: string, withYear: boolean) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

/** "12 – 15 Nov, 20 Nov +2 more" */
export function formatRanges(dates: string[], max = 2): string {
  const ranges = groupRanges(dates);
  const shown = ranges.slice(0, max).map(([a, b]) => (a === b ? short(a, false) : `${short(a, false)} – ${short(b, false)}`));
  const rest = ranges.length - shown.length;
  return shown.join(", ") + (rest > 0 ? ` +${rest} more` : "");
}

export function upcoming(dates: string[] | null | undefined): string[] {
  const today = todayISO();
  return (dates ?? []).filter((d) => d >= today).sort();
}

export function availabilityLabel(dates: string[] | null | undefined, booked?: string[] | null): string {
  const next = upcoming(dates);
  if (next.length === 0) return upcoming(booked).length > 0 ? "Fully booked" : "No longer available";
  return `Available ${formatRanges(next)}`;
}

export { formatDate };
