import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/account/actions";
import { requireUser } from "@/lib/account-auth";

export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-sand-dark pb-4">
        <nav aria-label="Account" className="flex flex-wrap gap-5 text-sm font-medium">
          <Link href="/account" className="hover:text-rose">
            My listings
          </Link>
          <Link href="/account/requests" className="hover:text-rose">
            Rental requests
          </Link>
          <Link href="/post-your-clothes" className="hover:text-rose">
            + Post new
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted sm:inline">{user.email}</span>
          <form action={logoutAction}>
            <button type="submit" className="btn-outline !min-h-9 !px-4">
              Sign out
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
