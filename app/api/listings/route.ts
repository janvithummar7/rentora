import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminClient, STORAGE_BUCKET } from "@/lib/supabase";
import { clientIp, LIMITS_ENABLED, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, listingSchema } from "@/lib/validations";
import { getCurrentUser, newClaimToken } from "@/lib/account-auth";
import { getDefaultMargin } from "@/lib/margin";
import { listingPrices } from "@/lib/pricing";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGES, MAX_IMAGE_BYTES, categoryName } from "@/lib/categories";

export const runtime = "nodejs";

const fail = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status });

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Confirms the bytes really are the image type the browser claimed. */
function sniffMime(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Invalid request.", 400);
  }

  if (String(form.get("website") ?? "").trim() !== "") {
    return NextResponse.json({ ok: true, id: randomUUID() }); // honeypot
  }

  const raw: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) if (typeof value === "string") raw[key] = value;

  const parsed = listingSchema.safeParse(raw);
  const errors = parsed.success ? {} : fieldErrors(parsed.error);

  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) errors.images = "Please add at least one photo.";
  else if (files.length > MAX_IMAGES) errors.images = `You can upload a maximum of ${MAX_IMAGES} images.`;
  if (!errors.images) {
    for (const f of files) {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(f.type)) {
        errors.images = "Only JPG, PNG or WebP images are allowed.";
        break;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        errors.images = "Each image must be 5 MB or smaller.";
        break;
      }
    }
  }
  if (!parsed.success || Object.keys(errors).length > 0) {
    return fail(Object.values(errors)[0] ?? "Please check the form.", 400, { fieldErrors: errors });
  }
  const input = parsed.data;

  // Abuse limit counts only valid submissions (not typos), and is generous: many phones share one IP.
  if (!rateLimit(`listing:${clientIp(req.headers)}`, 60, 60 * 60_000)) {
    return fail("Too many submissions from your network. Please try again in a little while.", 429);
  }

  const buffers: { buf: Buffer; mime: string }[] = [];
  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer());
    const mime = sniffMime(buf);
    if (!mime) return fail("One of the files is not a valid image.", 400, { fieldErrors: { images: "One of the files is not a valid image." } });
    buffers.push({ buf, mime });
  }

  const db = getAdminClientSafe();
  if (!db) return fail("We couldn't upload your listing. Please try again.", 500);

  const listingId = randomUUID();
  const uploaded: string[] = [];
  let ownerId: string | null = null;

  try {
    const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const { count, error: countError } = await db
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("mobile", input.whatsapp)
      .gte("created_at", since);
    if (countError) throw countError;
    if (LIMITS_ENABLED && (count ?? 0) >= 30) return fail("Too many listings from this number today. Please try again tomorrow.", 429);

    // Upload images: clothing-images/<listing-id>/image-N.ext
    const imageRows: { listing_id: string; image_url: string; is_primary: boolean }[] = [];
    for (const [i, { buf, mime }] of buffers.entries()) {
      const path = `${listingId}/image-${i + 1}.${EXT[mime]}`;
      const { error } = await db.storage.from(STORAGE_BUCKET).upload(path, buf, { contentType: mime, upsert: false });
      if (error) throw error;
      uploaded.push(path);
      imageRows.push({
        listing_id: listingId,
        image_url: db.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl,
        is_primary: i === 0,
      });
    }

    // A new owner row per submission: reusing/updating an existing row by mobile number
    // would let anyone redirect another owner's listings to their own number.
    // Signed-in owners get the row linked to their account right away; anonymous posters get a
    // one-time claim token so they can create an account afterwards and take ownership.
    const account = await getCurrentUser();
    const claim = account ? null : newClaimToken();
    const { data: owner, error: ownerError } = await db
      .from("users")
      .insert({
        name: input.ownerName,
        mobile: input.whatsapp,
        whatsapp_number: input.whatsapp,
        city: input.city,
        area: input.area,
        auth_user_id: account?.id ?? null,
        claim_token_hash: claim?.hash ?? null,
        claim_expires_at: claim?.expiresAt ?? null,
      })
      .select("id")
      .single();
    if (ownerError) throw ownerError;
    ownerId = owner.id;

    // The owner's price is stored privately; customers see it plus the platform margin.
    const margin = getDefaultMargin();
    const ownerSale = input.forSale ? (input.salePrice ?? null) : null;
    const prices = listingPrices(input.rentPrice, ownerSale, margin);
    const dates = input.availableDates;
    const { error: listingError } = await db.from("clothing_listings").insert({
      id: listingId,
      owner_id: owner.id,
      // Generated title; admins can edit it later.
      name: `${categoryName(input.category)} (Size ${input.sizes.join(", ")})`,
      category: input.category,
      description: "",
      location: `${input.area}, ${input.city}`,
      city: input.city,
      size: input.sizes.join(", "),
      sizes: input.sizes,
      owner_rent_price: input.rentPrice,
      owner_sale_price: ownerSale,
      margin_percent: margin,
      rent_price: prices.rent_price,
      security_deposit: 0,
      for_sale: input.forSale,
      sale_price: prices.sale_price,
      available_dates: dates,
      available_from: dates[0],
      available_to: dates[dates.length - 1],
      status: "pending",
    });
    if (listingError) throw listingError;

    const { error: imagesError } = await db.from("clothing_images").insert(imageRows);
    if (imagesError) throw imagesError;

    return NextResponse.json({
      ok: true,
      id: listingId,
      claimToken: claim?.token ?? null,
      signedIn: Boolean(account),
      forSale: input.forSale,
    });
  } catch (err) {
    console.error("listings POST failed", err);
    // Roll back anything half-written.
    if (uploaded.length) await db.storage.from(STORAGE_BUCKET).remove(uploaded).catch(() => undefined);
    if (ownerId) await db.from("users").delete().eq("id", ownerId); // cascades to listing + images
    return fail("We couldn't upload your listing. Please try again.", 500);
  }
}

function getAdminClientSafe() {
  try {
    return getAdminClient();
  } catch (err) {
    console.error(err);
    return null;
  }
}
