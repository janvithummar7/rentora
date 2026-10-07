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
import { deleteListingAndFiles } from "@/lib/listing-ops";
import { clampMargin, listingPrices } from "@/lib/pricing";
import { formatDate } from "@/lib/utils";
import { getAdminClient } from "@/lib/supabase";
import { adminListingSchema, fieldErrors } from "@/lib/validations";

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
  if (status === "approved") throw new Error("Use Approve (with margin) to approve a listing.");
  const { error } = await getAdminClient().from("clothing_listings").update({ status }).eq("id", id);
  if (error) throw error;
  refresh();
}

/**
 * Approves a listing and sets the platform margin for it. The price customers see is recomputed
 * from the owner's price and this margin.
 */
export async function approveListing(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("marginPercent") ?? "").trim();
  const margin = Number(raw);
  if (!id || raw === "" || !Number.isFinite(margin) || margin < 0 || margin > 300) {
    throw new Error("Please enter a margin between 0 and 300 percent.");
  }
  const db = getAdminClient();
  const { data: listing, error: readError } = await db
    .from("clothing_listings")
    .select("owner_rent_price, owner_sale_price")
    .eq("id", id)
    .single();
  if (readError || !listing) throw new Error("Listing not found.");
  const m = clampMargin(margin);
  const { error } = await db
    .from("clothing_listings")
    .update({ status: "approved", margin_percent: m, ...listingPrices(listing.owner_rent_price, listing.owner_sale_price, m) })
    .eq("id", id);
  if (error) throw error;
  refresh();
}

export type RequestStatusState = { error?: string; ok?: boolean };

/** Statuses that occupy the booked dates on the website. */
const BLOCKING = ["confirmed", "completed"];

/**
 * Updates an order's status. Confirmed/completed orders block their dates on the website (cancelling frees them),
 * so a confirmation that overlaps another confirmed/completed order for the same item is refused.
 */
export async function updateRequestStatus(_prev: RequestStatusState, formData: FormData): Promise<RequestStatusState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !(REQUEST_STATUSES as readonly string[]).includes(status)) return { error: "Invalid status." };
  const db = getAdminClient();

  if (BLOCKING.includes(status)) {
    const { data: req } = await db.from("rental_requests").select("listing_id,start_date,end_date").eq("id", id).maybeSingle();
    if (!req) return { error: "Request not found." };
    const { data: clash } = await db
      .from("rental_requests")
      .select("customer_name,start_date,end_date")
      .eq("listing_id", req.listing_id)
      .in("status", BLOCKING)
      .neq("id", id)
      .lte("start_date", req.end_date)
      .gte("end_date", req.start_date)
      .limit(1);
    if (clash && clash.length > 0) {
      const c = clash[0];
      return {
        error: `These dates overlap an already confirmed booking (${c.customer_name}, ${formatDate(c.start_date)} – ${formatDate(c.end_date)}). Cancel that one first.`,
      };
    }
  }

  const { error } = await db.from("rental_requests").update({ status }).eq("id", id);
  if (error) return { error: "We couldn't update the status. Please try again." };
  refresh();
  return { ok: true };
}

export async function deleteListing(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Invalid input");
  await deleteListingAndFiles(id);
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
  const parsed = adminListingSchema.safeParse(values);
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
      city: v.city ?? null,
      area: v.area ?? null,
    })
    .eq("id", ownerId);
  if (ownerError) return { error: ownerError.message };

  const { error } = await db
    .from("clothing_listings")
    .update({
      name: v.name,
      category: v.category,
      description: v.description ?? "",
      size: v.sizes.join(", "),
      sizes: v.sizes,
      color: v.color ?? null,
      brand: v.brand ?? null,
      condition: v.condition ?? null,
      owner_rent_price: v.rentPrice,
      owner_sale_price: v.forSale ? (v.salePrice ?? null) : null,
      margin_percent: clampMargin(v.marginPercent),
      ...listingPrices(v.rentPrice, v.forSale ? (v.salePrice ?? null) : null, clampMargin(v.marginPercent)),
      security_deposit: v.securityDeposit,
      location: [v.area, v.city].filter(Boolean).join(", ") || null,
      city: v.city ?? null,
      for_sale: v.forSale,
      available_dates: v.availableDates,
      available_from: v.availableDates[0],
      available_to: v.availableDates[v.availableDates.length - 1],
      status,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  refresh();
  return { ok: true };
}
