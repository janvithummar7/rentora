import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { LoginForm } from "@/components/admin/AdminBits";
import { isAdmin } from "@/lib/admin-auth";
import { getAdminCounts } from "@/lib/admin-data";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Gate: unauthenticated visitors only ever get the login form; the pages themselves
  // and every server action also re-check the session.
  if (!(await isAdmin())) {
    return (
      <div className="container-page">
        <LoginForm />
      </div>
    );
  }

  const counts = await getAdminCounts().catch(() => null);
  const Badge = ({ n }: { n?: number }) =>
    n ? <span className="ml-1.5 rounded-full bg-rose px-2 py-0.5 text-xs font-semibold text-white">{n}</span> : null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-sand-dark bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="font-serif text-lg font-semibold">{SITE_NAME} Admin</span>
            <nav aria-label="Admin" className="flex gap-4 text-sm font-medium">
              <Link href="/admin" className="hover:text-rose">
                Dashboard
              </Link>
              <Link href="/admin/listings" className="hover:text-rose">
                Listings
                <Badge n={counts?.pendingListings} />
              </Link>
              <Link href="/admin/requests" className="hover:text-rose">
                Requests
                <Badge n={counts?.newRequests} />
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-muted hover:text-rose">
              View site
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn-outline !min-h-9 !px-4">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="container-page py-8">{children}</div>
    </div>
  );
}
