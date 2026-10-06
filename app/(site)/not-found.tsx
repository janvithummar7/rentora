import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page max-w-xl py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-muted">The outfit may have been rented out or the link may be wrong.</p>
      <Link href="/clothes" className="btn-primary btn-lg mt-8">
        Browse Clothes
      </Link>
    </div>
  );
}
