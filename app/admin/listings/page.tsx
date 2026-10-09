import Image from "next/image";
import Link from "next/link";
import { ListingActions } from "@/components/admin/ListingActions";
import { StatusBadge } from "@/components/admin/AdminBits";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminListings } from "@/lib/admin-data";
import { LISTING_STATUSES, categoryName } from "@/lib/categories";
import { cn, formatDateTime, formatINR } from "@/lib/utils";

export default async function AdminListingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const active = status && (LISTING_STATUSES as readonly string[]).includes(status) ? status : "all";
  const listings = await getAdminListings(active);
  const tabs = ["all", ...LISTING_STATUSES];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Listings</h1>
      <nav aria-label="Status filter" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={t === "all" ? "/admin/listings" : `/admin/listings?status=${t}`}
            aria-current={active === t ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium capitalize",
              active === t ? "border-ink bg-ink text-cream" : "border-sand-dark bg-white hover:border-rose",
            )}
          >
            {t}
          </Link>
        ))}
      </nav>

      {listings.length === 0 ? (
        <p className="card p-8 text-center text-muted">No listings in this view.</p>
      ) : (
        <ul className="space-y-4">
          {listings.map((l) => {
            const img = (l.images.find((i) => i.is_primary) ?? l.images[0])?.image_url;
            return (
              <li key={l.id} className="card flex flex-col gap-4 p-4 sm:flex-row">
                <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
                  {img && <Image src={img} alt="" fill sizes="96px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/listings/${l.id}`} className="font-semibold hover:text-rose">
                      {l.name}
                    </Link>
                    <StatusBadge status={l.status} />
                    {l.is_seed && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs">seed</span>}
                  </div>
                  <p className="text-sm text-muted">
                    {categoryName(l.category)} · Size {l.size}{l.location ? ` · ${l.location}` : ""}
                  </p>
                  <p className="text-sm">
                    Owner {formatINR(l.owner_rent_price)}/day → customers{" "}
                    <span className="font-semibold">{formatINR(l.rent_price)}/day</span> ({Number(l.margin_percent)}% margin) · deposit {l.security_deposit > 0 ? formatINR(l.security_deposit) : "none"}
                    {l.for_sale && l.sale_price ? ` · sale ${formatINR(l.owner_sale_price ?? 0)} → ${formatINR(l.sale_price)}` : ""}
                  </p>
                  <p className="text-sm">
                    Owner: {l.owner.name} · {l.owner.mobile}
                    <span className="text-muted"> · {formatDateTime(l.created_at)}</span>
                  </p>
                  <ListingActions
                    id={l.id}
                    status={l.status}
                    ownerWhatsapp={l.owner.whatsapp_number}
                    ownerName={l.owner.name}
                    listingName={l.name}
                    ownerRent={l.owner_rent_price}
                    ownerSale={l.owner_sale_price}
                    margin={l.margin_percent}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
