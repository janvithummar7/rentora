"use client";

import { submitAction } from "@/lib/submit-action";
import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction, signupAction, type AuthState } from "@/app/account/actions";
import { Field, fieldProps } from "@/components/Field";

function Hidden({ claim, next }: { claim?: string; next?: string }) {
  return (
    <>
      {claim && <input type="hidden" name="claim" value={claim} />}
      {next && <input type="hidden" name="next" value={next} />}
    </>
  );
}

function Messages({ state }: { state: AuthState }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {state.notice}
        </p>
      )}
    </>
  );
}

export function LoginForm({ claim, next }: { claim?: string; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});
  const errors = state.errors ?? {};
  const qs = new URLSearchParams();
  if (claim) qs.set("claim", claim);
  if (next) qs.set("next", next);
  return (
    <form action={action} onSubmit={submitAction(action)} noValidate className="space-y-4">
      <Hidden claim={claim} next={next} />
      <Field name="email" label="Email" errors={errors} required>
        <input {...fieldProps("email", errors)} className="input" type="email" autoComplete="email" maxLength={120} />
      </Field>
      <Field name="password" label="Password" errors={errors} required>
        <input {...fieldProps("password", errors)} className="input" type="password" autoComplete="current-password" />
      </Field>
      <Messages state={state} />
      <button type="submit" disabled={pending} className="btn-primary btn-lg w-full">
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href={`/account/signup${qs.size ? `?${qs}` : ""}`} className="font-semibold text-rose hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ claim, next }: { claim?: string; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signupAction, {});
  const errors = state.errors ?? {};
  const qs = new URLSearchParams();
  if (claim) qs.set("claim", claim);
  if (next) qs.set("next", next);
  return (
    <form action={action} onSubmit={submitAction(action)} noValidate className="space-y-4">
      <Hidden claim={claim} next={next} />
      <Field name="email" label="Email" errors={errors} required>
        <input {...fieldProps("email", errors)} className="input" type="email" autoComplete="email" maxLength={120} />
      </Field>
      <Field name="password" label="Password" errors={errors} required hint="At least 8 characters.">
        <input {...fieldProps("password", errors)} className="input" type="password" autoComplete="new-password" />
      </Field>
      <Messages state={state} />
      <button type="submit" disabled={pending} className="btn-primary btn-lg w-full">
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : "Create account"}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/account/login${qs.size ? `?${qs}` : ""}`} className="font-semibold text-rose hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
