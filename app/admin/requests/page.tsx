import Link from "next/link";
import { setRequestStatus } from "@/app/admin/actions";
import { StatusBadge } from "@/components/admin/AdminBits";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminRequests } from "@/lib/admin-data";
import { REQUEST_STATUSES } from "@/lib/categories";
import { adminRequestSummary, adminToCustomerMessage, generateWhatsAppLink } from "@/lib/whatsapp";
import { cn, formatDate, formatDateTime, shortId } from "@/lib/utils";

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const active = status && (REQUEST_STATUSES as readonly string[]).includes(status) ? status : "all";
  const requests = await getAdminRequests(active);
  const tabs = ["all", ...REQUEST_STATUSES];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Rental requests</h1>
      <nav aria-label="Status filter" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={t === "all" ? "/admin/requests" : `/admin/requests?status=${t}`}
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

      {requests.length === 0 ? (
        <p className="card p-8 text-center text-muted">No requests in this view.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((r) => {
            const clothing = r.listing?.name ?? "Deleted listing";
            const summary = adminRequestSummary({
              clothingName: clothing,
              customerName: r.customer_name,
              customerMobile: r.customer_mobile,
              startDate: r.start_date,
              endDate: r.end_date,
            });
            return (
              <li key={r.id} className="card space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted">#{shortId(r.id)}</span>
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-muted">{formatDateTime(r.created_at)}</span>
                  </div>
                  <form action={setRequestStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <label htmlFor={`st-${r.id}`} className="sr-only">
                      Request status
                    </label>
                    <select id={`st-${r.id}`} name="status" defaultValue={r.status} className="input !w-auto !py-1.5 capitalize">
                      {REQUEST_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn-dark !min-h-9 !px-4 text-xs">
                      Update
                    </button>
                  </form>
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
                      {r.listing ? (
                        <Link href={`/admin/listings/${r.listing.id}`} className="hover:text-rose">
                          {clothing}
                        </Link>
                      ) : (
                        clothing
                      )}
                    </dd>
                    <dd className="text-muted">Owner: {r.listing?.owner.name ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Dates</dt>
                    <dd className="font-medium">
                      {formatDate(r.start_date)} – {formatDate(r.end_date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Message</dt>
                    <dd className="whitespace-pre-line">{r.message || "-"}</dd>
                  </div>
                </dl>

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
                  {r.listing && (
                    <a
                      href={generateWhatsAppLink(r.listing.owner.whatsapp_number, summary)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline !min-h-9 !px-4 text-xs"
                    >
                      <WhatsAppIcon className="h-4 w-4" /> Send request to owner
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
