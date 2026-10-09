import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { BrowseSkeleton } from "@/components/BrowseSkeleton";
import { MapPin, ShieldCheck } from "lucide-react";
import { BrowseView, readParams } from "@/components/BrowseView";
import { ImageGallery } from "@/components/ImageGallery";
import { RentalRequestDialog } from "@/components/RentalRequestDialog";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { categoryName, getCategory } from "@/lib/categories";
import { getListing, primaryImage } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { availabilityLabel, formatRanges, upcoming } from "@/lib/dates";
import { formatINR } from "@/lib/utils";

/**
 * /clothes/<slug> and /clothes/<uuid> share one route: a category slug lists that category,
 * a listing id shows the clothing details page.
 */
const loadListing = cache(async (id: string) => {
  try {
    return await getListing(id);
  } catch (err) {
    console.error("getListing failed", err);
    throw err;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const category = getCategory(id);
  if (category) {
    return {
      title: `${category.name} for Rent`,
      description: `Rent beautiful ${category.name.toLowerCase()} outfits. Send a request and confirm with our team on WhatsApp.`,
      alternates: { canonical: `/clothes/${category.slug}` },
    };
  }
  const listing = await loadListing(id).catch(() => null);
  if (!listing) return { title: "Clothing not found", robots: { index: false } };
  const title = listing.city ? `${listing.name} for Rent in ${listing.city}` : `${listing.name} for Rent`;
  const description = `Rent ${listing.name} (${categoryName(listing.category)}, size ${listing.size})${
    listing.location ? ` in ${listing.location}` : ""
  } for ${formatINR(listing.rent_price)} per day. ${listing.description ?? ""}`.slice(0, 200);
  const image = primaryImage(listing);
  return {
    title,
    description,
    alternates: { canonical: `/clothes/${listing.id}` },
    openGraph: { title, description, type: "website", images: image ? [image] : undefined },
  };
}

export default async function ClothesDetailOrCategory({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;

  const category = getCategory(id);
  if (category) {
    const params = readParams(await searchParams);
    return (
      <div className="container-page py-10">
        <header className="mb-6">
          <p className="eyebrow">Browse</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">{category.name} for Rent</h1>
          <p className="mt-2 text-muted">Beautiful {category.name.toLowerCase()} outfits available near you.</p>
        </header>
        <Suspense key={JSON.stringify(params)} fallback={<BrowseSkeleton />}>
          <BrowseView category={category.slug} params={params} />
        </Suspense>
      </div>
    );
  }

  const listing = await loadListing(id);
  if (!listing) notFound();

  const availableDays = upcoming(listing.available_dates);
  const bookedDays = upcoming(listing.booked_dates);
  const requestedDays = upcoming(listing.requested_dates);
  const availability = availableDays.length
    ? `Available: ${formatRanges(availableDays, 5)}`
    : availabilityLabel(listing.available_dates, listing.booked_dates);
  const details: [string, string | null][] = [
    ["Category", categoryName(listing.category)],
    [listing.sizes?.length > 1 ? "Sizes" : "Size", listing.sizes?.length ? listing.sizes.join(", ") : listing.size],
    ["Color", listing.color],
    ["Brand", listing.brand],
    ["Condition", listing.condition],
    ["Location", listing.location],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.name,
    description: listing.description,
    category: categoryName(listing.category),
    image: listing.images.map((i) => (i.image_url.startsWith("http") ? i.image_url : `${SITE_URL}${i.image_url}`)),
    offers: {
      "@type": "Offer",
      price: listing.rent_price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/clothes/${listing.id}`,
    },
  };

  return (
    <div className="container-page py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted">
        <Link href="/clothes" className="hover:text-rose">
          Browse
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/clothes/${listing.category}`} className="hover:text-rose">
          {categoryName(listing.category)}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{listing.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ImageGallery images={listing.images} alt={`${listing.name} - ${categoryName(listing.category)} for rent`} />

        <div className="space-y-6">
          <div>
            <p className="eyebrow">{categoryName(listing.category)}</p>
            <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">{listing.name}</h1>
            {listing.location && (
              <p className="mt-2 flex items-center gap-1.5 text-muted">
                <MapPin className="h-4 w-4" aria-hidden="true" /> {listing.location}
              </p>
            )}
          </div>

          <div className="card p-5">
            <p className="text-3xl font-semibold">
              {formatINR(listing.rent_price)} <span className="text-base font-normal text-muted">/ day</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {listing.security_deposit > 0
                ? `Refundable security deposit: ${formatINR(listing.security_deposit)}`
                : "No security deposit"}
            </p>
            {listing.security_deposit > 0 && (
              <p className="mt-1 text-xs text-muted">
                Paid when your booking is accepted. Returned after you give the outfit back, but not if it is damaged or
                broken.
              </p>
            )}
            <p className="mt-2 text-sm font-medium text-wa">{availability}</p>
            {requestedDays.length > 0 && (
              <p className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Requested by others (not confirmed yet): {formatRanges(requestedDays, 4)}. You can request these days
                too.
              </p>
            )}
            {bookedDays.length > 0 && (
              <p className="mt-1 text-sm text-muted">Already booked: {formatRanges(bookedDays, 4)}</p>
            )}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <RentalRequestDialog
                listingId={listing.id}
                listingName={listing.name}
                availableDates={listing.available_dates}
                bookedDates={listing.booked_dates}
                requestedDates={listing.requested_dates}
                securityDeposit={listing.security_deposit}
                rentPrice={listing.rent_price}
                className="btn-lg flex-1"
              />
              <a
                href={`/api/whatsapp/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn-wa btn-lg"
              >
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp Us
              </a>
            </div>
          </div>

          {listing.for_sale && listing.sale_price ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gold/50 bg-gold-soft p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7a5f2c]">Also for sale</p>
                <p className="text-2xl font-semibold">{formatINR(listing.sale_price)}</p>
              </div>
              <a
                href={`/api/whatsapp/${listing.id}?intent=buy`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn-dark"
              >
                <WhatsAppIcon className="h-5 w-5" /> Ask to buy
              </a>
            </div>
          ) : null}

          {listing.description && (
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-serif text-xl font-semibold">
                About this outfit
              </h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink/85">{listing.description}</p>
            </section>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-3xl border border-sand-dark/70 bg-white p-5 text-sm">
            {details
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
          </dl>
          <p className="flex items-start gap-2 text-xs text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            Send a request and our team will confirm availability and the final price with you on WhatsApp, then
            arrange pickup and payment.
          </p>
        </div>
      </div>
    </div>
  );
}
