import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** Category pills. Each links to the SEO-friendly /clothes/<slug> URL, keeping the other filters. */
export function CategoryFilter({ active, query }: { active?: string; query: string }) {
  const qs = query ? `?${query}` : "";
  const items = [{ slug: "", name: "All" }, ...CATEGORIES];
  return (
    <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 sm:flex-wrap">
        {items.map((c) => {
          const isActive = (active ?? "") === c.slug;
          return (
            <li key={c.slug || "all"} className="shrink-0">
              <Link
                href={`${c.slug ? `/clothes/${c.slug}` : "/clothes"}${qs}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                  isActive
                    ? "border-ink bg-ink text-cream"
                    : "border-sand-dark bg-white text-ink hover:border-rose hover:text-rose",
                )}
              >
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
