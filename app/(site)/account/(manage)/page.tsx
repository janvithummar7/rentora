import Image from "next/image";
import Link from "next/link";
import { ownerDeleteListing, ownerSetListingStatus } from "@/app/account/actions";
import { ConfirmButton, StatusBadge } from "@/components/admin/AdminBits";
import { requireUser } from "@/lib/account-auth";
import { getMyListings, type MyListing } from "@/lib/account-data";
import { categoryName } from "@/lib/categories";
import { formatRanges, upcoming } from "@/lib/dates";
import { formatINR } from "@/lib/utils";

const NOTE: Record<string, string> = {
  pending: "Waiting for review. It will go live once approved.",
  approved: "Live on the website.",
  rejected: "Not approved. Edit it and save to send it for review again.",
  rented: "Marked as rented. It is hidden from the website.",
};

const BTN = "inline-flex min-h-9 items-center rounded-full px-3.5 text-xs font-semibold";

function StatusButton({
  id,
  action,
  children,
  tone = "bg-stone-200 hover:bg-stone-300",
}: {
  id: string;
  action: string;
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <form action={ownerSetListingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <button type="submit" className={`${BTN} ${tone}`}>
        {children}
      </button>
    </form>
  );
}

function noteFor(l: MyListing): string {
  if (l.status === "inactive") {
    return l.paused_by_owner ? "Paused. Hidden from the website." : "Deactivated by our team. Contact us to reactivate.";
  }
  return NOTE[l.status] ?? "";
}

function Row({ l }: { l: MyListing }) {
  const img = (l.images.find((i) => i.is_primary) ?? l.images[0])?.image_url;
  const days = upcoming(l.available_dates);
  return (
    <li className="card flex flex-col gap-4 p-4 sm:flex-row">
      <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
        {img && <Image src={img} alt="" fill sizes="96px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/account/listings/${l.id}`} className="font-semibold hover:text-rose">
            {l.name}
          </Link>
          <StatusBadge status={l.status} />
        </div>
        <p className="text-sm text-muted">
          {categoryName(l.category)} · Your price {formatINR(l.owner_rent_price)}/day
          {" · Deposit "}
          {l.security_deposit > 0 ? formatINR(l.security_deposit) : "none"}
          {l.for_sale && l.owner_sale_price ? ` · For sale ${formatINR(l.owner_sale_price)}` : ""}
        </p>
        <p className="text-sm text-muted">
          {days.length ? `Available: ${formatRanges(days, 3)}` : "No upcoming dates. Edit to add more."}
        </p>
        <p className="text-xs text-muted">{noteFor(l)}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/account/listings/${l.id}`} className={`${BTN} bg-ink text-cream hover:bg-black`}>
            Edit
          </Link>
          {l.status === "approved" && (
            <>
              <StatusButton id={l.id} action="pause">
                Pause
              </StatusButton>
              <StatusButton id={l.id} action="rented" tone="bg-blue-100 text-blue-900 hover:bg-blue-200">
                Mark rented
              </StatusButton>
              <Link href={`/clothes/${l.id}`} className={`${BTN} border border-ink/25 hover:bg-white`}>
                View on site
              </Link>
            </>
          )}
          {l.status === "inactive" && l.paused_by_owner && (
            <StatusButton id={l.id} action="resume" tone="bg-green-700 text-white hover:bg-green-800">
              Resume
            </StatusButton>
          )}
          {l.status === "rented" && (
            <StatusButton id={l.id} action="available" tone="bg-green-700 text-white hover:bg-green-800">
              Available again
            </StatusButton>
          )}
          <form action={ownerDeleteListing}>
            <input type="hidden" name="id" value={l.id} />
            <ConfirmButton
              message={`Delete "${l.name}" permanently? This also deletes its photos.`}
              className={`${BTN} border border-red-300 text-red-700 hover:bg-red-50`}
            >
              Delete
            </ConfirmButton>
          </form>
        </div>
      </div>
    </li>
  );
}

export default async function AccountPage() {
  const user = await requireUser();
  const listings = await getMyListings(user.id);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">My listings</h1>
          <p className="mt-1 text-sm text-muted">
            Update prices and dates, pause an item, or mark it as rented. Prices here are what you receive; renters see
            them with our service fee added.
          </p>
        </div>
        <Link href="/post-your-clothes" className="btn-primary">
          + Post new clothes
        </Link>
      </div>
      {listings.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-serif text-xl font-semibold">No listings in your account yet.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Post an outfit while signed in and it appears here. If you posted before creating this account, use the
            &quot;Create account&quot; button on the confirmation page right after posting to link it.
          </p>
          <Link href="/post-your-clothes" className="btn-primary mt-5">
            Post Your Clothes
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {listings.map((l) => (
            <Row key={l.id} l={l} />
          ))}
        </ul>
      )}
    </div>
  );
}
