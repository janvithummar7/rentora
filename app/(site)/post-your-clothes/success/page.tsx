import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PlatformWhatsAppLink } from "@/components/WhatsAppButton";
import { shortId } from "@/lib/utils";

export const metadata: Metadata = { title: "Listing submitted", robots: { index: false } };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const listingRef = ref && /^[0-9a-f-]{36}$/i.test(ref) ? shortId(ref) : null;

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
