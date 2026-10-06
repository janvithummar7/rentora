export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatINR(amount: number): string {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

/** Formats a date-only string (YYYY-MM-DD) as "15 Oct 2026" without timezone drift. */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "";
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

/** Today's date (YYYY-MM-DD) in India time. */
export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function availabilityLabel(from: string | null, to: string | null): string {
  const today = todayISO();
  if (to && to < today) return "No longer available";
  if (from && from > today) return `Available from ${formatDate(from)}`;
  if (to) return `Available until ${formatDate(to)}`;
  return "Available now";
}

export function parseRange(value: string | undefined): { min?: number; max?: number } {
  if (!value) return {};
  const m = /^(\d*)-(\d*)$/.exec(value);
  if (!m) return {};
  return { min: m[1] ? Number(m[1]) : undefined, max: m[2] ? Number(m[2]) : undefined };
}
