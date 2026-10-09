"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { DatesPicker } from "@/components/DatePickers";
import { Field, fieldProps, type Errors } from "@/components/Field";
import { ImageUploader } from "@/components/ImageUploader";
import { SellToggle } from "@/components/SellToggle";
import { SizePicker } from "@/components/SizePicker";
import { CATEGORIES, MAX_IMAGES } from "@/lib/categories";
import { fieldErrors, listingSchema } from "@/lib/validations";

export function ListingForm({
  defaults,
}: {
  defaults?: { ownerName?: string; whatsapp?: string; city?: string; area?: string };
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setServerError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    const values = Object.fromEntries(Array.from(formData.entries()).filter(([, v]) => typeof v === "string"));
    const parsed = listingSchema.safeParse(values);
    const errs: Errors = parsed.success ? {} : fieldErrors(parsed.error);
    if (files.length === 0) errs.images = "Please add at least one photo.";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const target = form.querySelector(`[name="${firstKey}"]`) as HTMLElement | null;
      const isHidden = !target || target.getAttribute("type") === "hidden";
      (isHidden ? document.getElementById(`${firstKey}-section`) : target)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      if (!isHidden) target.focus({ preventScroll: true });
      return;
    }
    setErrors({});

    formData.delete("images");
    files.slice(0, MAX_IMAGES).forEach((f) => formData.append("images", f));

    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setServerError(data.error || "We couldn't upload your listing. Please try again.");
        return;
      }
      const qs = new URLSearchParams({ ref: data.id });
      if (data.claimToken) qs.set("claim", data.claimToken);
      if (data.forSale) qs.set("sale", "1");
      router.push(`/post-your-clothes/success?${qs}`);
    } catch {
      setServerError("We couldn't upload your listing. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="ownerName" label="Your name" errors={errors} required>
          <input {...fieldProps("ownerName", errors)} defaultValue={defaults?.ownerName} className="input" autoComplete="name" maxLength={60} />
        </Field>
        <Field
          name="whatsapp"
          label="WhatsApp number"
          errors={errors}
          required
          hint="Rental requests come to this number. It is never shown publicly."
        >
          <input
            {...fieldProps("whatsapp", errors)}
            defaultValue={defaults?.whatsapp}
            className="input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={16}
            placeholder="98765 43210"
          />
        </Field>
        <Field name="city" label="City" errors={errors} required>
          <input
            {...fieldProps("city", errors)}
            defaultValue={defaults?.city}
            className="input"
            autoComplete="address-level2"
            maxLength={60}
            placeholder="e.g. Ahmedabad"
          />
        </Field>
        <Field name="area" label="Area" errors={errors} required hint="Shown to renters. Your phone number never is.">
          <input
            {...fieldProps("area", errors)}
            defaultValue={defaults?.area}
            className="input"
            maxLength={80}
            placeholder="e.g. Satellite"
          />
        </Field>
        <Field name="category" label="Type" errors={errors} required>
          <select {...fieldProps("category", errors)} defaultValue="" className="input">
            <option value="" disabled>
              Choli, Saree, Kurti…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field name="rentPrice" label="Rent price (₹ per day)" errors={errors} required>
          <input {...fieldProps("rentPrice", errors)} className="input" type="number" inputMode="numeric" min={1} step={1} placeholder="1500" />
        </Field>
        <Field
          name="securityDeposit"
          label="Security deposit (₹)"
          errors={errors}
          hint="Refundable amount the renter pays upfront. Leave 0 if none."
        >
          <input
            {...fieldProps("securityDeposit", errors)}
            defaultValue={0}
            className="input"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
          />
        </Field>
      </div>

      <fieldset id="sizes-section" className="space-y-2">
        <legend className="text-sm font-medium">
          Size <span className="text-rose">*</span>
        </legend>
        <SizePicker
          name="sizes"
          error={errors.sizes}
          onChange={(s) => s.length && setErrors((prev) => ({ ...prev, sizes: undefined }))}
        />
      </fieldset>

      <SellToggle errors={errors} />

      <fieldset id="availableDates-section" className="space-y-2">
        <legend className="text-sm font-medium">
          Available dates <span className="text-rose">*</span>
        </legend>
        <DatesPicker
          name="availableDates"
          error={errors.availableDates}
          onChange={(d) => d.length && setErrors((prev) => ({ ...prev, availableDates: undefined }))}
        />
      </fieldset>

      <fieldset id="images-section" className="space-y-2">
        <legend className="text-sm font-medium">
          Photos <span className="text-rose">*</span>
        </legend>
        <ImageUploader
          error={errors.images}
          onChange={(f) => {
            setFiles(f);
            if (f.length) setErrors((prev) => ({ ...prev, images: undefined }));
          }}
        />
      </fieldset>

      {serverError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full">
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Uploading your listing…
          </>
        ) : (
          "POST MY CLOTHES"
        )}
      </button>
    </form>
  );
}
