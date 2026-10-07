import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OwnerEditForm } from "@/components/account/OwnerEditForm";
import { StatusBadge } from "@/components/admin/AdminBits";
import { requireUser } from "@/lib/account-auth";
import { getMyListing } from "@/lib/account-data";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditMyListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/account/listings/${id}`);
  if (!UUID.test(id)) notFound();
  const l = await getMyListing(user.id, id);
  if (!l) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/account" className="text-sm text-muted hover:text-rose">
          ← My listings
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold">Edit listing</h1>
          <StatusBadge status={l.status} />
        </div>
        {l.status === "rejected" && (
          <p className="mt-2 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">
            This listing wasn&apos;t approved. Update it and save to send it for review again.
          </p>
        )}
      </div>
      <ul className="flex flex-wrap gap-3">
        {l.images.map((img) => (
          <li key={img.id} className="relative h-32 w-24 overflow-hidden rounded-xl bg-sand">
            <Image src={img.image_url} alt="" fill sizes="96px" className="object-cover" />
          </li>
        ))}
      </ul>
      <div className="card p-5 sm:p-8">
        <OwnerEditForm
          id={l.id}
          defaults={{
            name: l.name,
            whatsapp: l.owner.whatsapp_number,
            city: l.owner.city ?? l.city ?? "",
            area: l.owner.area ?? "",
            description: l.description ?? "",
            sizes: l.sizes?.length ? l.sizes : l.size ? [l.size] : [],
            rentPrice: l.owner_rent_price,
            forSale: l.for_sale,
            salePrice: l.owner_sale_price,
            availableDates: l.available_dates ?? [],
          }}
        />
      </div>
      <p className="text-xs text-muted">To change photos, please contact us on WhatsApp.</p>
    </div>
  );
}
