import { z, type ZodError } from "zod";
import { CATEGORY_SLUGS, CONDITIONS, SIZES } from "@/lib/categories";
import { normalizeIndianMobile } from "@/lib/whatsapp";
import { todayISO } from "@/lib/utils";

export const MOBILE_ERROR = "Please enter a valid 10-digit mobile number.";

/** Strips HTML tags, control characters and collapses whitespace. Safe for plain-text storage. */
export function sanitizeText(value: string, opts: { multiline?: boolean } = {}): string {
  let v = value
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  if (opts.multiline) {
    v = v
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
  } else {
    v = v.replace(/\s+/g, " ");
  }
  return v.trim();
}

const text = (label: string, min: number, max: number, multiline = false) =>
  z
    .string({ required_error: `Please enter ${label}.`, invalid_type_error: `Please enter ${label}.` })
    .transform((v) => sanitizeText(v, { multiline }))
    .pipe(
      z
        .string()
        .min(min, min <= 1 ? `Please enter ${label}.` : `${label[0].toUpperCase()}${label.slice(1)} is too short.`)
        .max(max, `${label[0].toUpperCase()}${label.slice(1)} is too long (max ${max} characters).`),
    );

const optionalText = (max: number, multiline = false) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeText(v, { multiline }) || undefined : undefined))
    .pipe(z.string().max(max, `Too long (max ${max} characters).`).optional());

const optionalEmail = z
  .string()
  .optional()
  .transform((v) => v?.trim() || undefined)
  .pipe(z.string().email("Please enter a valid email address.").max(120).optional());

export const mobileSchema = z
  .string({ required_error: MOBILE_ERROR, invalid_type_error: MOBILE_ERROR })
  .transform((v) => normalizeIndianMobile(v) ?? "")
  .pipe(z.string().length(10, MOBILE_ERROR));

const optionalMobile = z
  .string()
  .optional()
  .transform((v) => v?.trim() || undefined)
  .pipe(mobileSchema.optional());

const dateString = (label: string) =>
  z
    .string({ required_error: `Please select ${label}.`, invalid_type_error: `Please select ${label}.` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `Please select ${label}.`);

const optionalDate = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date.")
    .optional(),
);

const money = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v.replace(/,/g, ""))) : v),
    z
      .number({ required_error: `Please enter ${label}.`, invalid_type_error: `Please enter ${label}.` })
      .int(`Please enter ${label} as a whole number.`)
      .min(min, min > 0 ? `${label[0].toUpperCase()}${label.slice(1)} must be at least â‚¹${min}.` : `${label} cannot be negative.`)
      .max(max, `${label[0].toUpperCase()}${label.slice(1)} is too high.`),
  );

/* ------------------------------ Rental request ------------------------------ */

export const rentalRequestSchema = z
  .object({
    listingId: z.string().uuid("Invalid listing."),
    customerName: text("your name", 2, 60),
    customerMobile: mobileSchema,
    customerEmail: optionalEmail,
    startDate: dateString("a start date"),
    endDate: dateString("an end date"),
    message: optionalText(500, true),
  })
  .superRefine((v, ctx) => {
    if (v.startDate < todayISO()) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: "Start date cannot be in the past." });
    }
    if (v.endDate < v.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after the start date." });
    }
  });

export type RentalRequestInput = z.infer<typeof rentalRequestSchema>;

/* --------------------------------- Listing --------------------------------- */

export const ownerSchema = z.object({
  ownerName: text("your name", 2, 60),
  mobile: mobileSchema,
  whatsapp: optionalMobile,
  email: optionalEmail,
  city: text("your city", 2, 60),
  area: text("your area", 2, 80),
});

export const clothingSchema = z.object({
  name: text("a clothing name", 3, 80),
  category: z.enum(CATEGORY_SLUGS, { errorMap: () => ({ message: "Please choose a category." }) }),
  description: text("a short description", 10, 1000, true),
  size: z.enum(SIZES, { errorMap: () => ({ message: "Please choose a size." }) }),
  color: text("a colour", 2, 40),
  brand: optionalText(60),
  condition: z.enum(CONDITIONS, { errorMap: () => ({ message: "Please choose the condition." }) }),
  rentPrice: money("the rent price", 1, 100000),
  securityDeposit: z.preprocess((v) => (v === "" || v == null ? 0 : v), money("the security deposit (0 if none)", 0, 500000)),
  availableFrom: optionalDate,
  availableTo: optionalDate,
});

const checkDates = (v: { availableFrom?: string; availableTo?: string }, ctx: z.RefinementCtx) => {
  if (v.availableFrom && v.availableTo && v.availableTo < v.availableFrom) {
    ctx.addIssue({ code: "custom", path: ["availableTo"], message: "'Available To' must be after 'Available From'." });
  }
};

export const listingSchema = ownerSchema.merge(clothingSchema).superRefine(checkDates);
export type ListingInput = z.infer<typeof listingSchema>;

/* ------------------------------- Admin helpers ------------------------------- */

export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

