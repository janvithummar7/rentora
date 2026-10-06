"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { updateListing, type ActionState } from "@/app/admin/actions";
import { ListingFields, type ListingDefaults } from "@/components/ListingFields";
import { LISTING_STATUSES } from "@/lib/categories";

export function ListingEditForm({
  id,
  ownerId,
  status,
  defaults,
}: {
  id: string;
  ownerId: string;
  status: string;
  defaults: ListingDefaults;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateListing, {});
  return (
    <form action={action} noValidate className="space-y-8">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="ownerId" value={ownerId} />

      <ListingFields errors={state.errors ?? {}} defaults={defaults} minDate="2000-01-01" />

      <div className="max-w-xs space-y-1.5">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        <select id="status" name="status" defaultValue={status} className="input capitalize">
          {LISTING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          Saved.
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-dark">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Save changes"}
      </button>
    </form>
  );
}
