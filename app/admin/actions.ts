"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminConfigured,
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { LISTING_STATUSES, REQUEST_STATUSES } from "@/lib/categories";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getAdminClient, STORAGE_BUCKET } from "@/lib/supabase";
import { fieldErrors, listingSchema } from "@/lib/validations";

export type ActionState = { error?: string; ok?: boolean; errors?: Record<string, string> };

function refresh() {
  revalidatePath("/", "layout");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!adminConfigured()) {
    return { error: "Admin is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET (16+ characters)." };
  }
  const ip = clientIp(await headers());
  if (!rateLimit(`admin-login:${ip}`, 5, 10 * 60_000)) {
    return { error: "Too many attempts. Please wait a few minutes." };
  }
  await new Promise((r) => setTimeout(r, 400)); // slow down guessing
  if (!verifyAdminPassword(String(formData.get("password") ?? ""))) {
    return { error: "Incorrect password." };
  }
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin");
}

export async function setListingStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !(LISTING_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid input");
  const { error } = await getAdminClient().from("clothing_listings").update({ status }).eq("id", id);
  if (error) throw error;
  refresh();
}

export async function setRequestStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !(REQUEST_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid input");
  const { error } = await getAdminClient().from("rental_requests").update({ status }).eq("id", id);
  if (error) throw error;
  refresh();
}

export async function deleteListing(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Invalid input");
  const db = getAdminClient();

  const { data: listing } = await db
    .from("clothing_listings")
    .select("owner_id, images:clothing_images(image_url)")
    .eq("id", id)
    .maybeSingle();
  if (!listing) redirect("/admin/listings");

  // Remove uploaded files (seed placeholders are local paths and have no storage object).
  const marker = `/${STORAGE_BUCKET}/`;
  const paths = ((listing.images ?? []) as { image_url: string }[])
    .map((i) => (i.image_url.includes(marker) ? decodeURIComponent(i.image_url.split(marker)[1]) : null))
    .filter((p): p is string => Boolean(p));
  if (paths.length) await db.storage.from(STORAGE_BUCKET).remove(paths);

  const { error } = await db.from("clothing_listings").delete().eq("id", id);
  if (error) throw error;

  // Drop the owner row if it no longer has any listing.
  const { count } = await db
    .from("clothing_listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", listing.owner_id);
  if (!count) await db.from("users").delete().eq("id", listing.owner_id);

  refresh();
  redirect("/admin/listings");
}

export async function updateListing(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !ownerId || !(LISTING_STATUSES as readonly string[]).includes(status)) {
    return { error: "Invalid input." };
  }

  const values = Object.fromEntries(Array.from(formData.entries()).filter(([, v]) => typeof v === "string"));
  const parsed = listingSchema.safeParse(values);
  if (!parsed.success) return { error: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  const v = parsed.data;

  const db = getAdminClient();
  const { error: ownerError } = await db
    .from("users")
    .update({
      name: v.ownerName,
      mobile: v.mobile,
      whatsapp_number: v.whatsapp ?? v.mobile,
      email: v.email ?? null,
      city: v.city,
      area: v.area,
    })
    .eq("id", ownerId);
  if (ownerError) return { error: ownerError.message };

  const { error } = await db
    .from("clothing_listings")
    .update({
      name: v.name,
      category: v.category,
      description: v.description,
      size: v.size,
      color: v.color,
      brand: v.brand ?? null,
      condition: v.condition,
      rent_price: v.rentPrice,
      security_deposit: v.securityDeposit,
      location: `${v.area}, ${v.city}`,
      city: v.city,
      available_from: v.availableFrom ?? null,
      available_to: v.availableTo ?? null,
      status,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  refresh();
  return { ok: true };
}
