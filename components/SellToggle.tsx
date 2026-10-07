"use client";

import { useState } from "react";
import { Field, fieldProps, type Errors } from "@/components/Field";
import { cn } from "@/lib/utils";

/** "Also sell this" chip. When on, shows a required selling-price field. */
export function SellToggle({
  label = "Selling price (₹)",
  errors,
  defaultOn = false,
  defaultPrice,
}: {
  label?: string;
  errors: Errors;
  defaultOn?: boolean;
  defaultPrice?: number | null;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="space-y-3 rounded-2xl border border-sand-dark bg-white p-4">
      <input type="hidden" name="forSale" value={on ? "1" : ""} />
      <button
        type="button"
        aria-pressed={on}
        onClick={() => setOn((v) => !v)}
        className={cn(
          "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors",
          on ? "border-ink bg-ink text-cream" : "border-sand-dark bg-white text-ink hover:border-rose",
        )}
      >
        {on ? "✓ " : "+ "}Also sell this
      </button>
      <p className="text-xs text-muted">Happy to sell this outfit too? Turn this on and add your selling price.</p>
      {on && (
        <Field name="salePrice" label={label} errors={errors} required>
          <input
            {...fieldProps("salePrice", errors)}
            defaultValue={defaultPrice ?? undefined}
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder="6500"
          />
        </Field>
      )}
    </div>
  );
}
