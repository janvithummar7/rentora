export type Category = { slug: string; name: string };

export const CATEGORIES: Category[] = [
  { slug: "choli", name: "Choli" },
  { slug: "lehenga", name: "Lehenga" },
  { slug: "saree", name: "Saree" },
  { slug: "kurti", name: "Kurti" },
  { slug: "dress", name: "Dress" },
  { slug: "gown", name: "Gown" },
  { slug: "anarkali", name: "Anarkali" },
  { slug: "salwar-suit", name: "Salwar Suit" },
  { slug: "other", name: "Other" },
];

export const POPULAR_CATEGORY_SLUGS = ["choli", "saree", "kurti", "lehenga", "dress", "gown"];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [string, ...string[]];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryName(slug: string): string {
  return getCategory(slug)?.name ?? "Other";
}

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"] as const;
export const CONDITIONS = ["New with tags", "Like new", "Good", "Fair"] as const;
export const LISTING_STATUSES = ["pending", "approved", "rejected", "rented", "inactive"] as const;
export const REQUEST_STATUSES = ["new", "contacted", "confirmed", "completed", "cancelled"] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PRICE_RANGES = [
  { value: "0-500", label: "Under ₹500" },
  { value: "500-1000", label: "₹500 – ₹1,000" },
  { value: "1000-2000", label: "₹1,000 – ₹2,000" },
  { value: "2000-", label: "₹2,000 & above" },
];

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
