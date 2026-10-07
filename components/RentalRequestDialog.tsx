"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { RentalRequestForm } from "@/components/RentalRequestForm";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  listingName: string;
  availableDates: string[];
  bookedDates?: string[];
  requestedDates?: string[];
  label?: string;
  className?: string;
};

/** Button that opens the rental request form in a modal. */
export function RentalRequestDialog({ label = "Send Rental Request", className, ...listing }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("btn-primary", className)}>
        {label}
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false); // click on backdrop
        }}
        aria-labelledby={`rr-title-${listing.listingId}`}
        className="m-auto w-[calc(100%-1.5rem)] max-w-lg overflow-visible rounded-3xl bg-cream p-0 text-ink shadow-2xl"
      >
        {open && (
          <div className="max-h-[90dvh] overflow-y-auto p-5 sm:p-7">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id={`rr-title-${listing.listingId}`} className="font-serif text-2xl font-semibold">
                Send Rental Request
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sand-dark"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <RentalRequestForm {...listing} onClose={() => setOpen(false)} />
          </div>
        )}
      </dialog>
    </>
  );
}
