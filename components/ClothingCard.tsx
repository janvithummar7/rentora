import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { RentalRequestDialog } from "@/components/RentalRequestDialog";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { categoryName } from "@/lib/categories";
import { primaryImage, type PublicListing } from "@/lib/data";
import { availabilityLabel, formatINR } from "@/lib/utils";

export function ClothingCard({ listing, priority = false }: { listing: PublicListing; priority?: boolean }) {
  const image = primaryImage(listing);
  const availability = availabilityLabel(listing.available_from, listing.available_to);
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

        <p className="flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{listing.location}</span>
        </p>

        <p className="text-sm text-muted">
          Size <span className="font-medium text-ink">{listing.size}</span>
          <span aria-hidden="true"> · </span>
          <span className="text-wa">{availability}</span>
        </p>

        <div>
          <p className="text-lg font-semibold">
            {formatINR(listing.rent_price)} <span className="text-sm font-normal text-muted">/ day</span>
          </p>
          {listing.security_deposit > 0 && (
            <p className="text-xs text-muted">Security deposit {formatINR(listing.security_deposit)}</p>
          )}
        </div>

        <p className="text-xs text-muted">Listed by {listing.owner_name}</p>

        <div className="mt-auto flex flex-col gap-2 pt-2 min-[420px]:flex-row">
          <RentalRequestDialog
            listingId={listing.id}
            listingName={listing.name}
            availableFrom={listing.available_from}
            availableTo={listing.available_to}
            label="Send Request"
            className="flex-1 !px-3"
          />
          <a
            href={`/api/whatsapp/${listing.id}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={`WhatsApp the owner about ${listing.name}`}
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
