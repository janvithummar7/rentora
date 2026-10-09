"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ClothingCard } from "@/components/ClothingCard";
import type { PublicListing } from "@/lib/listing-types";

/** Results grid. The first page comes from the server; "Show more" appends the next pages in place. */
export function BrowseGrid({ initial, total, query }: { initial: PublicListing[]; total: number; query: string }) {
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function showMore() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/browse?${query}${query ? "&" : ""}page=${page + 1}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "failed");
      const next = data.listings as PublicListing[];
      setItems((cur) => {
        const seen = new Set(cur.map((l) => l.id));
        return [...cur, ...next.filter((l) => !seen.has(l.id))];
      });
      setPage((p) => p + 1);
    } catch {
      setError("We couldn't load more clothes. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const hasMore = items.length < total;

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((l, i) => (
          <li key={l.id} className="contents">
            <ClothingCard listing={l} priority={i < 4} />
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center gap-3 pt-6">
        <p className="text-sm text-muted" aria-live="polite">
          Showing {items.length} of {total}
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {hasMore && (
          <button type="button" onClick={showMore} disabled={loading} className="btn-outline btn-lg min-w-48">
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading…
              </>
            ) : (
              "Show more"
            )}
          </button>
        )}
      </div>
    </>
  );
}
