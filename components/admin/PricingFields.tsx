"use client";

import { useState } from "react";
import { Field, fieldProps, type Errors } from "@/components/Field";
import { applyMargin } from "@/lib/pricing";
import { formatINR } from "@/lib/utils";

/** Owner's rent price + platform margin, with a live preview of what customers will see. */
export function PricingFields({
  errors,
  defaultRent,
  defaultMargin,
}: {
  errors: Errors;
  defaultRent: number | string;
  defaultMargin: number | string;
}) {
  const [rent, setRent] = useState(String(defaultRent ?? ""));
  const [margin, setMargin] = useState(String(defaultMargin ?? "25"));
  const r = Number(rent);
  const m = Number(margin);
  const ok = rent.trim() !== "" && margin.trim() !== "" && r > 0 && m >= 0 && m <= 300;

  return (
    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
      <Field name="rentPrice" label="Owner's rent price (₹ per day)" errors={errors} required>
        <input
          {...fieldProps("rentPrice", errors)}
          value={rent}
          onChange={(e) => setRent(e.target.value)}
          className="input"
          type="number"
          min={1}
          step={1}
        />
      </Field>
      <Field name="marginPercent" label="Platform margin (%)" errors={errors} required hint="Added on top of the owner's prices.">
        <input
          {...fieldProps("marginPercent", errors)}
          value={margin}
          onChange={(e) => setMargin(e.target.value)}
          className="input"
          type="number"
          min={0}
          max={300}
          step="any"
        />
      </Field>
      <p className="rounded-xl bg-gold-soft px-4 py-3 text-sm sm:col-span-2">
        Customers will see:{" "}
        <span className="font-semibold">{ok ? `${formatINR(applyMargin(r, m))} per day` : "enter a price and margin"}</span>
        {ok && <span className="text-muted"> (your margin {formatINR(applyMargin(r, m) - r)} per day). The sale price gets the same margin.</span>}
      </p>
    </div>
  );
}
