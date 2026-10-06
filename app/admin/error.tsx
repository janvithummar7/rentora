"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="card mx-auto mt-10 max-w-lg space-y-3 p-6">
      <h1 className="font-serif text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted">{error.message || "Unexpected error."}</p>
      <button type="button" onClick={reset} className="btn-dark">
        Try again
      </button>
    </div>
  );
}
