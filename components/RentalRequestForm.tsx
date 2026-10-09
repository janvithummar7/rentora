"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { RangePicker } from "@/components/DatePickers";
import { Field, fieldProps, type Errors } from "@/components/Field";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { fieldErrors, rentalRequestSchema } from "@/lib/validations";

type Props = {
  listingId: string;
  listingName: string;
  availableDates: string[];
  bookedDates?: string[];
  requestedDates?: string[];
  securityDeposit?: number;
  rentPrice?: number;
  onClose?: () => void;
};

export function RentalRequestForm({ listingId, listingName, availableDates, bookedDates = [], requestedDates = [], securityDeposit = 0, rentPrice, onClose }: Props) {
  const [agreed, setAgreed] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
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
    const payload = { ...values, listingId, startDate: start, endDate: end };

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
            Request sent successfully! Chat with our team on WhatsApp to confirm your rental and the final price.
          </p>
        </div>
        {!whatsappUrl && <p className="text-sm text-muted">Our team will contact you on your mobile number shortly.</p>}
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
        <p className="mt-1 text-xs text-ink/80">
          {rentPrice ? `Rent ₹${rentPrice.toLocaleString("en-IN")} / day · ` : ""}
          {securityDeposit > 0 ? (
            <>
              Security deposit <strong>₹{securityDeposit.toLocaleString("en-IN")}</strong> (refundable)
            </>
          ) : (
            "No security deposit"
          )}
        </p>
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

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Rental dates <span className="text-rose">*</span>
        </legend>
        <RangePicker
          allowed={availableDates}
          booked={bookedDates}
          requested={requestedDates}
          start={start}
          end={end}
          onChange={(s, e) => {
            setStart(s);
            setEnd(e);
          }}
          error={errors.startDate || errors.endDate}
        />
      </fieldset>

      <Field name="message" label="Message / Requirement" errors={errors}>
        <textarea
          {...fieldProps("message", errors)}
          className="input min-h-24 resize-y"
          maxLength={500}
          placeholder="Event, delivery or fitting needs, questions…"
        />
      </Field>

      <div className="rounded-2xl border border-gold/50 bg-gold-soft p-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            aria-invalid={errors.acceptTerms ? true : undefined}
            aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#a85d69]"
          />
          <span>
            {securityDeposit > 0 ? (
              <>
                I agree to pay the refundable security deposit of{" "}
                <strong>₹{securityDeposit.toLocaleString("en-IN")}</strong> when my booking is accepted. I understand
                that <strong>if the outfit is damaged or broken, the deposit will not be returned</strong>.
              </>
            ) : (
              <>
                I understand that I am responsible for the outfit while I have it, and{" "}
                <strong>if it is damaged or broken I may have to pay for it</strong>.
              </>
            )}
          </span>
        </label>
        {errors.acceptTerms && (
          <p id="acceptTerms-error" role="alert" className="mt-2 text-sm text-red-600">
            {errors.acceptTerms}
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={submitting || !agreed} className="btn-primary btn-lg w-full">
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Sending…
          </>
        ) : (
          "SEND REQUEST"
        )}
      </button>
      <p className="text-center text-xs text-muted">
        {agreed ? "Your request is saved, then WhatsApp opens so you can chat with our team." : "Tick the box above to send your request."}
      </p>
    </form>
  );
}
