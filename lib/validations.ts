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
        .min(min, `Please enter ${label}.`)
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
    acceptTerms: z.preprocess(
      (v) => v === true || v === "on" || v === "true" || v === "1",
      z.boolean().refine((v) => v === true, { message: "Please tick the box to accept the deposit and damage terms." }),
    ),
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

const availableDates = z.preprocess(
  (v) => (typeof v === "string" ? v.split(",").map((x) => x.trim()).filter(Boolean) : v),
  z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter valid dates."), {
      required_error: "Please select at least one available date.",
    })
    .min(1, "Please select at least one available date.")
    .max(366, "Please select fewer dates.")
    .transform((a) => [...new Set(a)].sort()),
);

const categoryField = z.enum(CATEGORY_SLUGS, { errorMap: () => ({ message: "Please choose the type of clothing." }) });
/** One or more sizes, submitted as a comma-separated string (e.g. "M,L"). Returned in SIZES order. */
const sizesField = z.preprocess(
  (v) => (typeof v === "string" ? v.split(",").map((x) => x.trim()).filter(Boolean) : v),
  z
    .array(z.enum(SIZES, { errorMap: () => ({ message: "Please choose a valid size." }) }), {
      required_error: "Please choose at least one size.",
    })
    .min(1, "Please choose at least one size.")
    .transform((a) => SIZES.filter((s) => a.includes(s))),
);

/** "Also sell this": a chip that, when on, requires a selling price. */
const forSaleField = z.preprocess((v) => v === "1" || v === "on" || v === "true" || v === true, z.boolean());
const salePriceField = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v.replace(/,/g, ""))) : v),
  z
    .number({ invalid_type_error: "Please enter the selling price." })
    .int("Please enter the selling price as a whole number.")
    .min(1, "Please enter the selling price.")
    .max(1_000_000, "Selling price is too high.")
    .optional(),
);
const checkSale = (v: { forSale: boolean; salePrice?: number }, ctx: z.RefinementCtx) => {
  if (v.forSale && !v.salePrice) {
    ctx.addIssue({ code: "custom", path: ["salePrice"], message: "Please enter the selling price." });
  }
};

/** Public "post your clothes" form: just the essentials. */
export const listingSchema = z
  .object({
    ownerName: text("your name", 2, 60),
    whatsapp: mobileSchema,
    city: text("your city", 2, 60),
    area: text("your area", 2, 80),
    category: categoryField,
    sizes: sizesField,
    rentPrice: money("the rent price", 1, 100000),
    securityDeposit: z.preprocess((v) => (v === "" || v == null ? 0 : v), money("the security deposit (0 if none)", 0, 500000)),
    forSale: forSaleField,
    salePrice: salePriceField,
    availableDates,
  })
  .superRefine((v, ctx) => {
    checkSale(v, ctx);
    if (v.availableDates.some((d) => d < todayISO())) {
      ctx.addIssue({ code: "custom", path: ["availableDates"], message: "Available dates cannot be in the past." });
    }
  });
export type ListingInput = z.infer<typeof listingSchema>;

/** Owner editing their own listing from the account area (past dates allowed: they may be kept). */
export const ownerEditSchema = z
  .object({
    name: text("a title", 3, 80),
    whatsapp: mobileSchema,
    city: text("your city", 2, 60),
    area: text("your area", 2, 80),
    description: optionalText(1000, true),
    sizes: sizesField,
    rentPrice: money("the rent price", 1, 100000),
    securityDeposit: z.preprocess((v) => (v === "" || v == null ? 0 : v), money("the security deposit (0 if none)", 0, 500000)),
    forSale: forSaleField,
    salePrice: salePriceField,
    availableDates,
  })
  .superRefine(checkSale);
export type OwnerEditInput = z.infer<typeof ownerEditSchema>;

/** Admin editor: every field, all but the essentials optional. */
export const adminListingSchema = z
  .object({
  ownerName: text("the owner name", 2, 60),
  mobile: mobileSchema,
  whatsapp: optionalMobile,
  email: optionalEmail,
  city: optionalText(60),
  area: optionalText(80),
  name: text("a clothing name", 3, 80),
  category: categoryField,
  description: optionalText(1000, true),
  sizes: sizesField,
  color: optionalText(40),
  brand: optionalText(60),
  condition: z
    .string()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.enum(CONDITIONS).optional()),
  rentPrice: money("the rent price", 1, 100000),
  securityDeposit: z.preprocess((v) => (v === "" || v == null ? 0 : v), money("the security deposit (0 if none)", 0, 500000)),
  forSale: forSaleField,
  salePrice: salePriceField,
  marginPercent: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v),
    z
      .number({ required_error: "Please enter the margin (0 for none).", invalid_type_error: "Please enter the margin (0 for none)." })
      .min(0, "Margin cannot be negative.")
      .max(300, "Margin is too high."),
  ),
  availableDates,
  })
  .superRefine(checkSale);
export type AdminListingInput = z.infer<typeof adminListingSchema>;

/* --------------------------------- Accounts --------------------------------- */

const emailField = z
  .string({ required_error: "Please enter your email." })
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address.")
  .max(120);

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: "Please enter your password." }).min(1, "Please enter your password.").max(200),
});

export const signupSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: "Please choose a password." })
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long (max 72 characters)."),
});

/* ------------------------------- Admin helpers ------------------------------- */

export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

