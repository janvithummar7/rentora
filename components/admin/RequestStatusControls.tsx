"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { updateRequestStatus, type RequestStatusState } from "@/app/admin/actions";
import { REQUEST_STATUSES } from "@/lib/categories";
import { submitAction } from "@/lib/submit-action";
import { cn } from "@/lib/utils";

const LABEL: Record<string, string> = {
  new: "Mark as new",
  contacted: "Contacted",
  confirmed: "Confirm booking",
  completed: "Mark completed",
  cancelled: "Cancel",
};

/** One-click status buttons. Confirmed and completed orders occupy their dates on the website. */
export function RequestStatusControls({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState<RequestStatusState, FormData>(updateRequestStatus, {});
  const primary = status === "completed" ? "" : status === "confirmed" ? "completed" : "confirmed";

  return (
    <form action={action} onSubmit={submitAction(action)} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-center gap-2">
        {REQUEST_STATUSES.filter((s) => s !== status).map((s) => (
          <button
            key={s}
            type="submit"
            name="status"
            value={s}
            disabled={pending}
            className={cn(
              "inline-flex min-h-9 items-center rounded-full px-3.5 text-xs font-semibold disabled:opacity-60",
              s === primary
                ? "bg-green-700 text-white hover:bg-green-800"
                : s === "cancelled"
                  ? "border border-red-300 text-red-700 hover:bg-red-50"
                  : "border border-ink/25 hover:bg-white",
            )}
          >
            {LABEL[s]}
          </button>
        ))}
        {pending && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-label="Updating" />}
      </div>
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && !pending && (
        <p role="status" className="text-xs text-green-800">
          Status updated.
        </p>
      )}
    </form>
  );
}
