"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { type Errors } from "@/components/Field";
import { ImageUploader } from "@/components/ImageUploader";
import { ListingFields } from "@/components/ListingFields";
import { MAX_IMAGES } from "@/lib/categories";
import { fieldErrors, listingSchema } from "@/lib/validations";

export function ListingForm() {
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
      const firstKey = Object.keys(errs).find((k) => k !== "images") ?? "images";
      const target = form.querySelector(`[name="${firstKey}"]`) as HTMLElement | null;
      (target ?? document.getElementById("images-section"))?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
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
      router.push(`/post-your-clothes/success?ref=${encodeURIComponent(data.id)}`);
    } catch {
      setServerError("We couldn't upload your listing. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {/* Honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <ListingFields errors={errors} />

      <fieldset id="images-section" className="space-y-3">
        <legend className="mb-1 font-serif text-xl font-semibold">Photos</legend>
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

      <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full sm:w-auto">
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
