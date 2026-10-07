import Link from "next/link";
import { StatusBadge } from "@/components/admin/AdminBits";
import { requireUser } from "@/lib/account-auth";
import { getMyRequests } from "@/lib/account-data";
import { formatDate, formatDateTime } from "@/lib/utils";

const LABEL: Record<string, string> = {
  new: "Received",
  contacted: "We're checking with you",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function MyRequestsPage() {
  const user = await requireUser("/account/requests");
  const requests = await getMyRequests(user.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Rental requests</h1>
        <p className="mt-1 text-sm text-muted">
          Interest in your clothes. Our team handles the renters and will contact you on WhatsApp to confirm each
          booking, so you don&apos;t need to reply to anyone.
        </p>
      </div>
      {requests.length === 0 ? (
        <p className="card p-8 text-center text-muted">No requests yet. They appear here as soon as someone asks.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-semibold">
                  {r.listing ? (
                    <Link href={`/account/listings/${r.listing.id}`} className="hover:text-rose">
                      {r.listing.name}
                    </Link>
                  ) : (
                    "Deleted listing"
                  )}
                </p>
                <p className="text-sm text-muted">
                  Requested for {formatDate(r.start_date)} – {formatDate(r.end_date)} · received{" "}
                  {formatDateTime(r.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">{LABEL[r.status] ?? r.status}</span>
                <StatusBadge status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
