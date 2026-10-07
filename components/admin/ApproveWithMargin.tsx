"use client";

import { useState } from "react";
import { approveListing } from "@/app/admin/actions";
import { applyMargin } from "@/lib/pricing";
import { formatINR } from "@/lib/utils";

/** Approve a listing and choose the margin at the same time. Shows the resulting customer price. */
export function ApproveWithMargin({
  id,
  ownerRent,
  ownerSale,
  defaultMargin,
  label = "Approve",
}: {
  id: string;
  ownerRent: number;
  ownerSale: number | null;
  defaultMargin: number;
  label?: string;
}) {
  const [margin, setMargin] = useState(String(defaultMargin));
  const m = Number(margin);
  const valid = margin.trim() !== "" && Number.isFinite(m) && m >= 0 && m <= 300;
  const rent = valid ? applyMargin(ownerRent, m) : null;
  const sale = valid && ownerSale ? applyMargin(ownerSale, m) : null;

  return (
    <form action={approveListing} className="flex flex-wrap items-end gap-x-3 gap-y-2 rounded-2xl bg-gold-soft p-3">
      <input type="hidden" name="id" value={id} />
      <div className="text-xs">
        <p className="text-muted">Owner asks</p>
        <p className="text-sm font-semibold">
          {formatINR(ownerRent)}/day{ownerSale ? ` · sale ${formatINR(ownerSale)}` : ""}
        </p>
      </div>
      <div>
        <label htmlFor={`margin-${id}`} className="block text-xs text-muted">
          Your margin (%)
        </label>
        <input
          id={`margin-${id}`}
          name="marginPercent"
          type="number"
          inputMode="decimal"
          min={0}
          max={300}
          step="any"
          required
          value={margin}
          onChange={(e) => setMargin(e.target.value)}
          className="input !w-24 !py-1.5"
        />
      </div>
      <div className="text-xs">
        <p className="text-muted">Customers will see</p>
        <p className="text-sm font-semibold">
          {rent !== null ? `${formatINR(rent)}/day${sale ? ` · sale ${formatINR(sale)}` : ""}` : "Enter a margin"}
        </p>
      </div>
      <button type="submit" disabled={!valid} className="inline-flex min-h-9 items-center rounded-full bg-green-700 px-4 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50">
        {label}
      </button>
    </form>
  );
}
