import Link from "next/link";
import { RequestCard } from "@/components/admin/RequestCard";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminRequests } from "@/lib/admin-data";
import { REQUEST_STATUSES } from "@/lib/categories";
import { cn } from "@/lib/utils";

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
          {requests.map((r) => (
            <RequestCard key={r.id} r={r} />
          ))}
        </ul>
      )}
    </div>
  );
}
