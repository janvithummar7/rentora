import Link from "next/link";
import { Search, SearchX } from "lucide-react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { BrowseGrid } from "@/components/BrowseGrid";
import { DEFAULT_SORT, PRICE_RANGES, SIZES, SORT_OPTIONS, categoryName } from "@/lib/categories";
import { getListings } from "@/lib/data";

export type BrowseParams = { q?: string; city?: string; size?: string; price?: string; sort?: string; page?: string };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function readParams(sp: Record<string, string | string[] | undefined>): BrowseParams {
  return { q: first(sp.q), city: first(sp.city), size: first(sp.size), price: first(sp.price), sort: first(sp.sort), page: first(sp.page) };
}

function toQuery(p: BrowseParams, extra: Record<string, string | undefined> = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...p, ...extra })) if (v) sp.set(k, v);
  return sp.toString();
}

export async function BrowseView({ category, params }: { category?: string; params: BrowseParams }) {
  const base = category ? `/clothes/${category}` : "/clothes";
  const page = 1; // further pages are loaded in the browser by the "Show more" button
  const gridQuery = toQuery({ ...params, page: undefined }, category ? { category } : {});
  const filterQuery = toQuery({ ...params, page: undefined });
  const hasFilters = Boolean(params.q || params.city || params.size || params.price);

  let result: Awaited<ReturnType<typeof getListings>> | null = null;
  let failed = false;
  try {
    result = await getListings({ category, ...params, page });
  } catch (err) {
    console.error("browse failed", err);
    failed = true;
  }


  return (
    <div className="space-y-6">
      <CategoryFilter active={category} query={filterQuery} />

      <form action={base} method="get" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1.2fr_1.3fr_auto]">
        <div>
          <label htmlFor="q" className="sr-only">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input id="q" name="q" defaultValue={params.q} placeholder="Search choli, saree, colour…" className="input !pl-10" maxLength={60} />
          </div>
        </div>
        <div>
          <label htmlFor="city" className="sr-only">
            Location
          </label>
          <input id="city" name="city" defaultValue={params.city} placeholder="Location (e.g. Ahmedabad)" className="input" maxLength={60} />
        </div>
        <div>
          <label htmlFor="size" className="sr-only">
            Size
          </label>
          <select id="size" name="size" defaultValue={params.size ?? ""} className="input">
            <option value="">Any size</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="price" className="sr-only">
            Price per day
          </label>
          <select id="price" name="price" defaultValue={params.price ?? ""} className="input">
            <option value="">Any price</option>
            {PRICE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="sr-only">
            Sort by
          </label>
          <select id="sort" name="sort" defaultValue={params.sort ?? DEFAULT_SORT} className="input">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <button type="submit" className="btn-dark flex-1">
            Apply
          </button>
          {hasFilters && (
            <Link href={base} className="btn-outline">
              Clear
            </Link>
          )}
        </div>
      </form>

      {failed ? (
        <div role="alert" className="card p-10 text-center">
          <p className="font-serif text-xl font-semibold">We couldn&apos;t load the clothes right now.</p>
          <p className="mt-2 text-sm text-muted">Please refresh the page or try again in a moment.</p>
        </div>
      ) : result && result.listings.length === 0 ? (
        <div className="card flex flex-col items-center p-10 text-center">
          <SearchX className="h-10 w-10 text-gold" aria-hidden="true" />
          <p className="mt-3 font-serif text-xl font-semibold">
            No clothes found{category ? ` in ${categoryName(category)}` : ""} yet.
          </p>
          <p className="mt-2 max-w-md text-sm text-muted">
            No clothes found for this category yet. Check another category or come back soon.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/clothes" className="btn-outline">
              See all clothes
            </Link>
            <Link href="/post-your-clothes" className="btn-primary">
              Post Your Clothes
            </Link>
          </div>
        </div>
      ) : (
        result && (
          <>
            <p className="text-sm text-muted" aria-live="polite">
              {result.total} {result.total === 1 ? "outfit" : "outfits"} available
            </p>
            <BrowseGrid key={gridQuery} initial={result.listings} total={result.total} query={gridQuery} />
          </>
        )
      )}
    </div>
  );
}
