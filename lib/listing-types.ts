// Client-safe listing types and helpers (no server-only imports), shared by server pages and client components.

export type ListingImage = { id: string; image_url: string; is_primary: boolean };

export type PublicListing = {
  id: string;
  name: string;
  category: string;
  description: string;
  size: string;
  sizes: string[];
  color: string | null;
  brand: string | null;
  condition: string | null;
  rent_price: number;
  security_deposit: number;
  location: string | null;
  city: string | null;
  available_from: string | null;
  available_to: string | null;
  /** Days the owner offered that are still free (booked days removed). */
  available_dates: string[];
  /** Days the owner offered that are already booked (confirmed/completed orders). Shown as occupied. */
  booked_dates: string[];
  /** Free days that other renters have requested but that are not confirmed yet. Still requestable. */
  requested_dates: string[];
  for_sale: boolean;
  sale_price: number | null;
  created_at: string;
  owner_name: string;
  images: ListingImage[];
};

export function primaryImage(listing: Pick<PublicListing, "images">): string | null {
  return (listing.images.find((i) => i.is_primary) ?? listing.images[0])?.image_url ?? null;
}
