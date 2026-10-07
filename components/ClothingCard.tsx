import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { RentalRequestDialog } from "@/components/RentalRequestDialog";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { categoryName } from "@/lib/categories";
import { primaryImage, type PublicListing } from "@/lib/data";
import { availabilityLabel, upcoming } from "@/lib/dates";
import { formatINR } from "@/lib/utils";

export function ClothingCard({ listing, priority = false }: { listing: PublicListing; priority?: boolean }) {
  const image = primaryImage(listing);
  const availability = availabilityLabel(listing.available_dates, listing.booked_dates);
  const href = `/clothes/${listing.id}`;

  return (
    <article className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg hover:shadow-ink/5">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden bg-sand" aria-label={listing.name}>
        {image ? (
          <Image
            src={image}
            alt={`${listing.name} - ${categoryName(listing.category)} for rent`}
            fill
            sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:420px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-muted">No photo</span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-3 py-1 text-xs font-semibold">
          {categoryName(listing.category)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <h3 className="font-serif text-lg font-semibold leading-snug">
          <Link href={href} className="hover:text-rose">
            {listing.name}
          </Link>
        </h3>

        {listing.location && (
          <p className="flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{listing.location}</span>
          </p>
        )}

        <p className="text-sm text-muted">
          {listing.sizes?.length > 1 ? "Sizes" : "Size"}{" "}
          <span className="font-medium text-ink">{listing.sizes?.length ? listing.sizes.join(", ") : listing.size}</span>
        </p>
        <p className="text-sm font-medium text-wa">{availability}</p>
        {upcoming(listing.requested_dates).length > 0 && (
          <p className="w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
            Requested by others · you can request too
          </p>
        )}

        <div>
          <p className="text-lg font-semibold">
            {formatINR(listing.rent_price)} <span className="text-sm font-normal text-muted">/ day</span>
          </p>
          {listing.for_sale && listing.sale_price ? (
            <p className="text-xs font-medium text-[#7a5f2c]">Also for sale: {formatINR(listing.sale_price)}</p>
          ) : null}
          {listing.security_deposit > 0 && (
            <p className="text-xs text-muted">Security deposit {formatINR(listing.security_deposit)}</p>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2 min-[420px]:flex-row">
          <RentalRequestDialog
            listingId={listing.id}
            listingName={listing.name}
            availableDates={listing.available_dates}
            bookedDates={listing.booked_dates}
            requestedDates={listing.requested_dates}
            label="Send Request"
            className="flex-1 !px-3"
          />
          <a
            href={`/api/whatsapp/${listing.id}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={`Ask us about ${listing.name} on WhatsApp`}
            className="btn-wa !px-3 min-[420px]:!px-4"
          >
            <WhatsAppIcon className="h-5 w-5" />
            <span className="min-[420px]:sr-only xl:not-sr-only">WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  );
}
