import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, LayoutDashboard } from "lucide-react";
import { PlatformWhatsAppLink } from "@/components/WhatsAppButton";
import { getCurrentUser } from "@/lib/account-auth";
import { shortId } from "@/lib/utils";

export const metadata: Metadata = { title: "Listing submitted", robots: { index: false } };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; claim?: string; sale?: string }>;
}) {
  const { ref, claim, sale } = await searchParams;
  const listingRef = ref && /^[0-9a-f-]{36}$/i.test(ref) ? shortId(ref) : null;
  const user = await getCurrentUser();
  const claimQs = claim ? `?claim=${encodeURIComponent(claim)}` : "";

  return (
    <div className="container-page max-w-xl py-16 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-wa" aria-hidden="true" />
      <h1 className="mt-5 font-serif text-3xl font-semibold sm:text-4xl">
        Your clothes have been submitted successfully!
      </h1>
      <p className="mt-3 text-lg text-muted">Our team will review your listing and make it available for rental.</p>
      {listingRef && (
        <p className="mt-5 inline-block rounded-full bg-gold-soft px-4 py-1.5 text-sm">
          Listing ID: <span className="font-mono font-semibold">{listingRef}</span>
        </p>
      )}

      {user ? (
        <div className="card mt-8 p-5 text-left">
          <p className="font-semibold">Saved to your account</p>
          <p className="mt-1 text-sm text-muted">
            You can edit prices and dates, pause the listing, and see rental requests from your account.
          </p>
          <Link href="/account" className="btn-dark mt-4">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Open my account
          </Link>
        </div>
      ) : claim ? (
        <div className="card mt-8 border-gold/60 bg-gold-soft p-5 text-left">
          <p className="font-serif text-xl font-semibold">
            {sale ? "Selling too? Create your account to manage it." : "Create your account to manage your clothes"}
          </p>
          <p className="mt-1 text-sm text-muted">
            Edit prices{sale ? " (rent and sale)" : ""} and dates, pause or mark items as rented, and see all your
            rental requests in one place. It takes under a minute.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={`/account/signup${claimQs}`} className="btn-dark">
              Create account
            </Link>
            <Link href={`/account/login${claimQs}`} className="text-sm font-semibold text-rose hover:underline">
              I already have an account
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted">
            Optional. Your listing is already submitted. Do this on this device soon: the link that connects this
            listing to your account expires in 14 days.
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <PlatformWhatsAppLink
          className="btn-lg"
          message={`Hi, I just submitted a listing${listingRef ? ` (ID ${listingRef})` : ""} on the website. Please review it.`}
        />
        <Link href="/clothes" className="btn-outline btn-lg">
          Browse Clothes
        </Link>
      </div>
      <p className="mt-6 text-sm text-muted">
        <Link href="/post-your-clothes" className="text-rose hover:underline">
          Post another outfit
        </Link>
      </p>
    </div>
  );
}
