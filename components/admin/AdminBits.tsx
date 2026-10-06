"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction, type ActionState } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  rented: "bg-blue-100 text-blue-800",
  inactive: "bg-stone-200 text-stone-700",
  new: "bg-rose-soft text-rose-dark",
  contacted: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-stone-200 text-stone-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", TONES[status] ?? "bg-stone-100")}>
      {status}
    </span>
  );
}

/** Submit button that asks for confirmation first (destructive actions). */
export function ConfirmButton({
  message,
  children,
  className,
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, {});
  return (
    <form action={action} className="card mx-auto mt-24 w-full max-w-sm space-y-4 p-6">
      <h1 className="font-serif text-2xl font-semibold">Admin sign in</h1>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-dark w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Sign in"}
      </button>
    </form>
  );
}
