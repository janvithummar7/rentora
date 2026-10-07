import Image from "next/image";
import Link from "next/link";
import { ListingActions } from "@/components/admin/ListingActions";
import { RequestCard } from "@/components/admin/RequestCard";
import { StatusBadge } from "@/components/admin/AdminBits";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminCounts, getAdminListings, getAdminRequests } from "@/lib/admin-data";
import { categoryName } from "@/lib/categories";
import { formatDateTime } from "@/lib/utils";

export default async function AdminDashboard() {
  await requireAdmin();
  const [counts, pending, requests] = await Promise.all([
    getAdminCounts(),
    getAdminListings("pending"),
    getAdminRequests(),
  ]);

  const stats = [
    { label: "Pending listings", value: counts.pendingListings, href: "/admin/listings?status=pending" },
    { label: "All listings", value: counts.totalListings, href: "/admin/listings" },
    { label: "New requests", value: counts.newRequests, href: "/admin/requests?status=new" },
    { label: "All requests", value: counts.totalRequests, href: "/admin/requests" },
  ];

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl font-semibold">Dashboard</h1>

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="card block p-5 hover:border-rose">
              <p className="text-3xl font-semibold">{s.value}</p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold">
            Rental requests
            {counts.newRequests > 0 && (
              <span className="ml-2 rounded-full bg-rose px-2.5 py-0.5 align-middle text-xs font-semibold text-white">
                {counts.newRequests} new
              </span>
            )}
          </h2>
          <Link href="/admin/requests" className="text-sm font-semibold text-rose hover:underline">
            All requests
          </Link>
        </div>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No requests yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {requests.slice(0, 10).map((r) => (
              <RequestCard key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold">Listings waiting for approval</h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing to review right now.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {pending.map((l) => {
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
                    </div>
                    <p className="text-sm text-muted">
                      {categoryName(l.category)} · Size {l.size} · {l.location ? `${l.location} · ` : ""}
                      Submitted {formatDateTime(l.created_at)}
                    </p>
                    <p className="text-sm">
                      Owner: {l.owner.name} · {l.owner.mobile}
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
      </section>

    </div>
  );
}
