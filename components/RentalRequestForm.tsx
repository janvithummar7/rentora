"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Field, fieldProps, type Errors } from "@/components/Field";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { fieldErrors, rentalRequestSchema } from "@/lib/validations";
import { todayISO } from "@/lib/utils";

type Props = {
  listingId: string;
  listingName: string;
  availableFrom: string | null;
  availableTo: string | null;
  onClose?: () => void;
};

export function RentalRequestForm({ listingId, listingName, availableFrom, availableTo, onClose }: Props) {
  const today = todayISO();
  const minDate = availableFrom && availableFrom > today ? availableFrom : today;
  const [start, setStart] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null | undefined>(undefined); // undefined = not sent

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setServerError("");
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const payload = { ...values, listingId };

    const parsed = rentalRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      (form.querySelector(`[name="${Object.keys(errs)[0]}"]`) as HTMLElement | null)?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/rental-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setServerError(data.error || "We couldn't send your request. Please try again.");
        return;
      }
      setWhatsappUrl(data.whatsappUrl ?? null);
      // Open WhatsApp straight away; if the browser blocks the pop-up the button below still works.
      if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank");
    } catch {
      setServerError("We couldn't send your request. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (whatsappUrl !== undefined) {
    return (
      <div className="space-y-5 py-4 text-center" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-wa" aria-hidden="true" />
        <div>
          <h3 className="font-serif text-2xl font-semibold">Request sent!</h3>
          <p className="mt-2 text-sm text-muted">
            Request sent successfully! You can now connect with the owner on WhatsApp.
          </p>
        </div>
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-wa btn-lg w-full">
            <WhatsAppIcon className="h-5 w-5" />
            Open WhatsApp
          </a>
        )}
        {onClose && (
          <button type="button" onClick={onClose} className="btn-outline w-full">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="rounded-2xl bg-rose-soft px-4 py-3 text-sm">
        <span className="text-muted">You are requesting:</span>
        <p className="font-semibold text-ink">{listingName}</p>
      </div>

      {/* Honeypot: hidden from people, tempting for bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <Field name="customerName" label="Name" errors={errors} required>
        <input {...fieldProps("customerName", errors)} className="input" autoComplete="name" maxLength={60} placeholder="Your name" />
      </Field>

      <Field name="customerMobile" label="Mobile Number" errors={errors} required hint="10-digit number. +91 is fine.">
        <input
          {...fieldProps("customerMobile", errors)}
          className="input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={16}
          placeholder="98765 43210"
        />
      </Field>

      <Field name="customerEmail" label="Email" errors={errors}>
        <input {...fieldProps("customerEmail", errors)} className="input" type="email" autoComplete="email" maxLength={120} placeholder="you@example.com" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="startDate" label="Rental Start Date" errors={errors} required>
          <input
            {...fieldProps("startDate", errors)}
            className="input"
            type="date"
            min={minDate}
            max={availableTo ?? undefined}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </Field>
        <Field name="endDate" label="Rental End Date" errors={errors} required>
          <input
            {...fieldProps("endDate", errors)}
            className="input"
            type="date"
            min={start || minDate}
            max={availableTo ?? undefined}
          />
        </Field>
      </div>

      <Field name="message" label="Message / Requirement" errors={errors}>
        <textarea
          {...fieldProps("message", errors)}
          className="input min-h-24 resize-y"
          maxLength={500}
          placeholder="Event, delivery or fitting needs, questions…"
        />
      </Field>

      {serverError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full">
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Sending…
          </>
        ) : (
          "SEND REQUEST"
        )}
      </button>
      <p className="text-center text-xs text-muted">
        Your request is saved, then WhatsApp opens so you can chat with the owner.
      </p>
    </form>
  );
}
