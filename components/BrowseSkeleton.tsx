export function BrowseSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="aspect-[4/5] animate-pulse bg-sand" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-sand" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-sand" />
            <div className="h-10 animate-pulse rounded-full bg-sand" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading clothes…</span>
    </div>
  );
}
