import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseSkeleton } from "@/components/BrowseSkeleton";
import { BrowseView, readParams } from "@/components/BrowseView";

export const metadata: Metadata = {
  title: "Browse Clothes for Rent",
  description:
    "Browse cholis, sarees, kurtis, lehengas, gowns and dresses available for rent. Send a request and confirm with our team on WhatsApp.",
  alternates: { canonical: "/clothes" },
};

export default async function ClothesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = readParams(await searchParams);
  return (
    <div className="container-page py-10">
      <header className="mb-6">
        <p className="eyebrow">Browse</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">Available for Rent</h1>
        <p className="mt-2 text-muted">Find your perfect choli, saree, kurti or dress for your special day.</p>
      </header>
      <Suspense key={JSON.stringify(params)} fallback={<BrowseSkeleton />}>
        <BrowseView params={params} />
      </Suspense>
    </div>
  );
}
