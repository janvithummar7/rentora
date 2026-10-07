"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { daysBetween, formatRanges } from "@/lib/dates";
import { cn, formatDate, todayISO } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type DayState = {
  disabled: boolean;
  selected: boolean;
  between?: boolean;
  available?: boolean;
  booked?: boolean;
  requested?: boolean;
};

const ymOf = (iso: string) => iso.slice(0, 7);
function shiftYm(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}
function monthCells(ym: string): (string | null)[] {
  const [y, m] = ym.split("-").map(Number);
  const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: count }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`),
  ];
}

function Calendar({
  startYm,
  minYm,
  maxYm,
  state,
  onPick,
}: {
  startYm: string;
  minYm: string;
  maxYm: string;
  state: (d: string) => DayState;
  onPick: (d: string) => void;
}) {
  const [ym, setYm] = useState(startYm);
  const title = new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <div className="rounded-2xl border border-sand-dark bg-white p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setYm(shiftYm(ym, -1))}
          disabled={ym <= minYm}
          aria-label="Previous month"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-semibold" aria-live="polite">
          {title}
        </p>
        <button
          type="button"
          onClick={() => setYm(shiftYm(ym, 1))}
          disabled={ym >= maxYm}
          aria-label="Next month"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-muted">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="py-1">
            {d}
          </span>
        ))}
        {monthCells(ym).map((d, i) => {
          if (!d) return <span key={`b${i}`} />;
          const s = state(d);
          return (
            <button
              key={d}
              type="button"
              disabled={s.disabled}
              onClick={() => onPick(d)}
              aria-label={
                s.booked
                  ? `${formatDate(d)} (booked)`
                  : s.requested
                    ? `${formatDate(d)} (requested by others, not confirmed)`
                    : formatDate(d)
              }
              aria-pressed={s.selected}
              className={cn(
                "mx-auto h-10 w-10 rounded-full text-sm transition-colors",
                s.selected
                  ? "bg-rose font-semibold text-white"
                  : s.between
                    ? "rounded-none bg-rose-soft text-ink"
                    : s.booked
                      ? "bg-red-50 text-red-700/80 line-through"
                      : s.disabled
                      ? "text-muted/40"
                      : s.available && s.requested
                        ? "bg-amber-100 font-medium text-amber-900 hover:bg-amber-200"
                        : s.available
                        ? "bg-green-50 font-medium text-green-900 hover:bg-green-100"
                        : "text-ink hover:bg-sand",
              )}
            >
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Owner: choose available days as a range, or tap individual days. */
export function DatesPicker({
  name,
  error,
  defaultValue = [],
  onChange,
}: {
  name: string;
  error?: string;
  defaultValue?: string[];
  onChange?: (dates: string[]) => void;
}) {
  const today = todayISO();
  const [dates, setDatesState] = useState<string[]>(defaultValue);
  const setDates = (next: string[] | ((cur: string[]) => string[])) => {
    const value = typeof next === "function" ? next(dates) : next;
    setDatesState(value);
    onChange?.(value);
  };
  const [mode, setMode] = useState<"range" | "single">("single");
  const [pending, setPending] = useState<string | null>(null);
  const set = useMemo(() => new Set(dates), [dates]);

  function pick(d: string) {
    if (mode === "single") {
      setDates((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));
      return;
    }
    if (!pending) return setPending(d);
    if (pending === d) {
      // tapping the same day twice toggles just that day
      setDates((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));
      return setPending(null);
    }
    const [a, b] = pending < d ? [pending, d] : [d, pending];
    setDates((cur) => [...new Set([...cur, ...daysBetween(a, b)])].sort());
    setPending(null);
  }

  const upcomingCount = dates.length;
  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={dates.join(",")} />
      <div role="group" aria-label="How to pick dates" className="inline-flex rounded-full border border-sand-dark bg-white p-1 text-sm">
        {(
          [
            ["single", "Individual days"],
            ["range", "Date range"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m);
              setPending(null);
            }}
            className={cn("min-h-9 rounded-full px-4 font-medium", mode === m ? "bg-ink text-cream" : "text-ink/70")}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        {mode === "single"
          ? "Tap each day you are available. Tap again to remove it."
          : pending
            ? `Start: ${formatDate(pending)}. Now tap the last available day.`
            : "Tap the first available day, then the last. Repeat to add more ranges."}
      </p>
      <Calendar
        startYm={ymOf(today)}
        minYm={ymOf(today)}
        maxYm={shiftYm(ymOf(today), 11)}
        state={(d) => ({ disabled: d < today, selected: set.has(d) || d === pending })}
        onPick={pick}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>
          {upcomingCount ? (
            <>
              <span className="font-medium">
                {upcomingCount} {upcomingCount === 1 ? "day" : "days"} selected:
              </span>{" "}
              <span className="text-muted">{formatRanges(dates, 6)}</span>
            </>
          ) : (
            <span className="text-muted">No dates selected yet.</span>
          )}
        </p>
        {upcomingCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setDates([]);
              setPending(null);
            }}
            className="font-semibold text-rose hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Renter: choose a start and end day, only from the days the owner marked available. */
export function RangePicker({
  allowed,
  booked = [],
  requested = [],
  start,
  end,
  onChange,
  error,
}: {
  allowed: string[];
  /** Offered days that are already taken by confirmed/completed orders. Shown as occupied. */
  booked?: string[];
  /** Offered days others have requested (not confirmed). Still selectable. */
  requested?: string[];
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  error?: string;
}) {
  const today = todayISO();
  const days = useMemo(() => allowed.filter((d) => d >= today).sort(), [allowed, today]);
  const set = useMemo(() => new Set(days), [days]);
  const bookedDays = useMemo(() => booked.filter((d) => d >= today).sort(), [booked, today]);
  const bookedSet = useMemo(() => new Set(bookedDays), [bookedDays]);
  const requestedSet = useMemo(() => new Set(requested), [requested]);
  const [notice, setNotice] = useState("");

  if (days.length === 0) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {bookedDays.length > 0
          ? `Fully booked. Already booked: ${formatRanges(bookedDays, 4)}.`
          : "This item has no upcoming available dates."}
      </p>
    );
  }

  function pick(d: string) {
    setNotice("");
    // First tap selects that single day (one tap is enough for a one-day rental).
    if (!start || end !== start) return onChange(d, d); // nothing yet, or a finished multi-day range: start over
    // A single day is selected: tapping it again clears it, a later day extends the stay.
    if (d === start) return onChange("", "");
    if (d < start) return onChange(d, d);
    if (daysBetween(start, d).every((x) => set.has(x))) return onChange(start, d);
    setNotice("Some days in between are not available. Please choose a shorter stay.");
    onChange(d, d);
  }

  const selectedEnd = end || null;
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted" aria-live="polite">
        {!start
          ? "Tap a day to select it. For a longer stay, tap your last day next."
          : start === end
            ? "One day selected. Tap a later day to extend your stay, or tap it again to clear."
            : ""}
      </p>
      <Calendar
        startYm={ymOf([days[0], bookedDays[0]].filter(Boolean).sort()[0])}
        minYm={ymOf([days[0], bookedDays[0]].filter(Boolean).sort()[0])}
        maxYm={ymOf([days[days.length - 1], bookedDays[bookedDays.length - 1]].filter(Boolean).sort().at(-1)!)}
        state={(d) => ({
          disabled: !set.has(d),
          available: set.has(d),
          booked: bookedSet.has(d),
          requested: requestedSet.has(d),
          selected: d === start || d === selectedEnd,
          between: Boolean(start && end && d > start && d < end),
        })}
        onPick={pick}
      />
      <p className="text-xs text-muted">
        Green days are available
        {requested.length > 0 ? ", amber days are requested by others but not confirmed yet (you can still request them)" : ""}
        {bookedDays.length > 0 ? ", red days are already booked" : ""}. Available:{" "}
        {formatRanges(days, 4)}
        {bookedDays.length > 0 ? ` · Booked: ${formatRanges(bookedDays, 4)}` : ""}
      </p>
      {start && end && (
        <p className="rounded-xl bg-rose-soft px-3 py-2 text-sm font-medium">
          {formatDate(start)} {start !== end && `to ${formatDate(end)}`} · {daysBetween(start, end).length}{" "}
          {daysBetween(start, end).length === 1 ? "day" : "days"}
        </p>
      )}
      {(notice || error) && (
        <p role="alert" className="text-sm text-red-600">
          {notice || error}
        </p>
      )}
    </div>
  );
}
