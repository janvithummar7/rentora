"use client";

import { useState } from "react";
import { SIZES } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** Multi-select size chips. Submits the selection as one comma-separated field. */
export function SizePicker({
  name,
  error,
  defaultValue = [],
  onChange,
}: {
  name: string;
  error?: string;
  defaultValue?: string[];
  onChange?: (sizes: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue);

  function toggle(size: string) {
    const next = selected.includes(size) ? selected.filter((s) => s !== size) : [...selected, size];
    setSelected(next);
    onChange?.(next);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={SIZES.filter((s) => selected.includes(s)).join(",")} />
      <div role="group" aria-label="Sizes" className="flex flex-wrap gap-2">
        {SIZES.map((s) => {
          const on = selected.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s)}
              className={cn(
                "inline-flex min-h-10 min-w-12 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors",
                on ? "border-ink bg-ink text-cream" : "border-sand-dark bg-white text-ink hover:border-rose",
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted">Choose every size you can offer.</p>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
