import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingActions } from "@/components/admin/ListingActions";
import { ListingEditForm } from "@/components/admin/ListingEditForm";
import { StatusBadge } from "@/components/admin/AdminBits";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminListing, getBlockingRequests } from "@/lib/admin-data";
import { formatDate } from "@/lib/utils";
import { shortId } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminListingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const l = await getAdminListing(id);
  if (!l) notFound();
  const bookings = await getBlockingRequests(l.id);

  const defaults = {
    ownerName: l.owner.name,
    mobile: l.owner.mobile,
    whatsapp: l.owner.whatsapp_number,
    email: l.owner.email ?? "",
    city: l.city ?? "",
    area: l.owner.area ?? "",
    name: l.name,
    category: l.category,
    description: l.description,
    sizes: l.sizes?.length ? l.sizes : l.size ? [l.size] : [],
    color: l.color ?? "",
    brand: l.brand ?? "",
    condition: l.condition ?? "",
    rentPrice: l.owner_rent_price,
    securityDeposit: l.security_deposit,
    marginPercent: Number(l.margin_percent),
    forSale: l.for_sale,
    salePrice: l.owner_sale_price,
    availableDates: l.available_dates ?? [],
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/listings" className="text-sm text-muted hover:text-rose">
          ← All listings
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold">{l.name}</h1>
          <StatusBadge status={l.status} />
          <span className="font-mono text-xs text-muted">ID {shortId(l.id)}</span>
        </div>
      </div>

      <ListingActions
        id={l.id}
        status={l.status}
        ownerWhatsapp={l.owner.whatsapp_number}
        ownerName={l.owner.name}
        listingName={l.name}
        ownerRent={l.owner_rent_price}
        ownerSale={l.owner_sale_price}
        margin={l.margin_percent}
        showEdit={false}
      />

      <section className="card p-4 text-sm">
        <h2 className="font-semibold">Booked dates</h2>
        {bookings.length === 0 ? (
          <p className="mt-1 text-muted">No confirmed or completed orders. All offered dates are open.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {bookings.map((b) => (
              <li key={b.id}>
                <span className="font-medium">
                  {formatDate(b.start_date)} – {formatDate(b.end_date)}
                </span>{" "}
                <span className="text-muted">
                  · {b.customer_name} · {b.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="flex flex-wrap gap-3">
        {l.images.map((img) => (
          <li key={img.id} className="relative h-40 w-32 overflow-hidden rounded-2xl bg-sand">
            <Image src={img.image_url} alt={l.name} fill sizes="128px" className="object-cover" />
            {img.is_primary && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-cream">
                Main
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="card p-5 sm:p-8">
        <ListingEditForm id={l.id} ownerId={l.owner_id} status={l.status} defaults={defaults} />
      </div>
    </div>
  );
}
