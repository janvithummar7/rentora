import Link from "next/link";
import { StatusBadge } from "@/components/admin/AdminBits";
import { RequestStatusControls } from "@/components/admin/RequestStatusControls";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import type { AdminRequest } from "@/lib/admin-data";
import { daysBetween } from "@/lib/dates";
import { rentalTotals } from "@/lib/pricing";
import { cn, formatDate, formatDateTime, formatINR, shortId } from "@/lib/utils";
import { adminToCustomerMessage, generateWhatsAppLink, ownerAvailabilityMessage } from "@/lib/whatsapp";

/** One rental request with the money breakdown and the WhatsApp actions the admin needs. */
export function RequestCard({ r }: { r: AdminRequest }) {
  const l = r.listing;
  const clothing = l?.name ?? "Deleted listing";
  const days = daysBetween(r.start_date, r.end_date).length;
  const totals = l ? rentalTotals({ rentPrice: l.rent_price, ownerRentPrice: l.owner_rent_price, days }) : null;

  return (
    <li className={cn("card space-y-3 p-4 sm:p-5", r.status === "new" && "border-rose/60 ring-1 ring-rose/20")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted">#{shortId(r.id)}</span>
          <StatusBadge status={r.status} />
          <span className="text-xs text-muted">{formatDateTime(r.created_at)}</span>
          {(r.status === "confirmed" || r.status === "completed") && (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              Dates blocked on the website
            </span>
          )}
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted">Customer</dt>
          <dd className="font-medium">{r.customer_name}</dd>
          <dd>{r.customer_mobile}</dd>
          {r.customer_email && <dd className="truncate text-muted">{r.customer_email}</dd>}
        </div>
        <div>
          <dt className="text-muted">Clothing</dt>
          <dd className="font-medium">
            {l ? (
              <Link href={`/admin/listings/${l.id}`} className="hover:text-rose">
                {clothing}
              </Link>
            ) : (
              clothing
            )}
          </dd>
          <dd className="text-muted">Owner: {l?.owner.name ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted">Dates</dt>
          <dd className="font-medium">
            {formatDate(r.start_date)} – {formatDate(r.end_date)}
          </dd>
          <dd className="text-muted">
            {days} {days === 1 ? "day" : "days"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Message</dt>
          <dd className="whitespace-pre-line">{r.message || "-"}</dd>
        </div>
      </dl>

      {totals && l && (
        <p className="rounded-xl bg-gold-soft px-4 py-2 text-sm">
          Customer pays <span className="font-semibold">{formatINR(totals.customer)}</span> ({formatINR(l.rent_price)} ×{" "}
          {days}) · Owner gets <span className="font-semibold">{formatINR(totals.owner)}</span> ({formatINR(l.owner_rent_price)}{" "}
          × {days}) · Your margin <span className="font-semibold text-green-800">{formatINR(totals.margin)}</span>
        </p>
      )}

      <div className="space-y-1">
        <RequestStatusControls id={r.id} status={r.status} />
        <p className="text-xs text-muted">
          Confirming or completing an order marks its dates as booked on the website. Cancelling frees them.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={generateWhatsAppLink(
            r.customer_mobile,
            adminToCustomerMessage({
              customerName: r.customer_name,
              clothingName: clothing,
              startDate: r.start_date,
              endDate: r.end_date,
            }),
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-wa !min-h-9 !px-4 text-xs"
        >
          <WhatsAppIcon className="h-4 w-4" /> Contact Customer on WhatsApp
        </a>
        {l && (
          <a
            href={generateWhatsAppLink(
              l.owner.whatsapp_number,
              ownerAvailabilityMessage({
                ownerName: l.owner.name,
                clothingName: clothing,
                startDate: r.start_date,
                endDate: r.end_date,
              }),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline !min-h-9 !px-4 text-xs"
          >
            <WhatsAppIcon className="h-4 w-4" /> Ask owner if available
          </a>
        )}
      </div>
    </li>
  );
}
