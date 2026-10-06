import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingActions } from "@/components/admin/ListingActions";
import { ListingEditForm } from "@/components/admin/ListingEditForm";
import { StatusBadge } from "@/components/admin/AdminBits";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminListing } from "@/lib/admin-data";
import { shortId } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminListingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const l = await getAdminListing(id);
  if (!l) notFound();

  const defaults = {
    ownerName: l.owner.name,
    mobile: l.owner.mobile,
    whatsapp: l.owner.whatsapp_number,
    email: l.owner.email ?? "",
    city: l.city,
    area: l.owner.area ?? l.location.split(",")[0],
    name: l.name,
    category: l.category,
    description: l.description,
    size: l.size,
    color: l.color ?? "",
    brand: l.brand ?? "",
    condition: l.condition,
    rentPrice: l.rent_price,
    securityDeposit: l.security_deposit,
    availableFrom: l.available_from ?? "",
    availableTo: l.available_to ?? "",
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
        showEdit={false}
      />

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
