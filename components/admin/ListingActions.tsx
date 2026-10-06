import Link from "next/link";
import { deleteListing, setListingStatus } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/AdminBits";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { generateWhatsAppLink } from "@/lib/whatsapp";

const STATUS_BUTTONS = [
  { status: "approved", label: "Approve", tone: "bg-green-700 text-white hover:bg-green-800" },
  { status: "rejected", label: "Reject", tone: "bg-red-700 text-white hover:bg-red-800" },
  { status: "inactive", label: "Mark unavailable", tone: "bg-stone-200 hover:bg-stone-300" },
  { status: "rented", label: "Mark rented", tone: "bg-blue-100 text-blue-900 hover:bg-blue-200" },
  { status: "pending", label: "Back to pending", tone: "bg-amber-100 text-amber-900 hover:bg-amber-200" },
] as const;

const BTN = "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold";

export function ListingActions({
  id,
  status,
  ownerWhatsapp,
  ownerName,
  listingName,
  showEdit = true,
  showDelete = true,
}: {
  id: string;
  status: string;
  ownerWhatsapp: string;
  ownerName: string;
  listingName: string;
  showEdit?: boolean;
  showDelete?: boolean;
}) {
  const wa = generateWhatsAppLink(
    ownerWhatsapp,
    `Hi ${ownerName}, this is regarding your listing "${listingName}" on our clothing rental website.`,
  );
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_BUTTONS.filter((b) => b.status !== status).map((b) => (
        <form key={b.status} action={setListingStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={b.status} />
          <button type="submit" className={`${BTN} ${b.tone}`}>
            {b.label}
          </button>
        </form>
      ))}
      {showEdit && (
        <Link href={`/admin/listings/${id}`} className={`${BTN} border border-ink/25 hover:bg-white`}>
          Edit
        </Link>
      )}
      <a href={wa} target="_blank" rel="noopener noreferrer" className={`${BTN} bg-wa text-white hover:bg-wa-dark`}>
        <WhatsAppIcon className="h-3.5 w-3.5" /> Owner
      </a>
      {showDelete && (
        <form action={deleteListing}>
          <input type="hidden" name="id" value={id} />
          <ConfirmButton message={`Delete "${listingName}" permanently? This also deletes its photos.`} className={`${BTN} border border-red-300 text-red-700 hover:bg-red-50`}>
            Delete
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
