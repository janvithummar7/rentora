import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { SITE_URL } from "@/lib/site";
import { getListings } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ["", "/clothes", "/post-your-clothes", "/how-it-works", "/contact", "/privacy-policy", "/terms"];
  const entries: MetadataRoute.Sitemap = [
    ...staticPages.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}/clothes/${c.slug}` })),
  ];
  try {
    const { listings } = await getListings({ page: 1 });
    entries.push(...listings.map((l) => ({ url: `${SITE_URL}/clothes/${l.id}`, lastModified: l.created_at })));
  } catch {
    // Supabase unavailable at build time: ship the static part only.
  }
  return entries;
}
