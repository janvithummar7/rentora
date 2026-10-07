"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { claimWithToken, getAuthClient, requireUser, safeNext } from "@/lib/account-auth";
import { ownedListingState } from "@/lib/account-data";
import { deleteListingAndFiles } from "@/lib/listing-ops";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { listingPrices } from "@/lib/pricing";
import { getAdminClient } from "@/lib/supabase";
import { fieldErrors, loginSchema, ownerEditSchema, signupSchema } from "@/lib/validations";

export type AuthState = { error?: string; notice?: string; errors?: Record<string, string> };
export type EditState = { error?: string; ok?: boolean; errors?: Record<string, string> };

const refresh = () => revalidatePath("/", "layout");

async function limited(kind: string, limit: number): Promise<boolean> {
  return !rateLimit(`${kind}:${clientIp(await headers())}`, limit, 10 * 60_000);
}

/* ---------------------------------- auth ---------------------------------- */

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await limited("signup", 8)) return { error: "Too many attempts. Please wait a few minutes." };
  const parsed = signupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const claim = String(formData.get("claim") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  try {
    const supabase = await getAuthClient();
    const { data, error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password });
    if (error) {
      return { error: /registered|exists/i.test(error.message) ? "An account with this email already exists. Please sign in." : error.message };
    }
    // With email confirmation on, an existing address comes back with no identities.
    if (!data.user || data.user.identities?.length === 0) {
      return { error: "An account with this email already exists. Please sign in." };
    }
    if (claim) await claimWithToken(claim, data.user.id);
    if (data.session) {
      refresh();
      redirect(next);
    }
    return { notice: "Account created. Check your email to confirm your address, then sign in." };
  } catch (err) {
    if (isRedirect(err)) throw err;
    console.error("signup failed", err);
    return { error: "We couldn't create your account. Please try again." };
  }
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await limited("login", 10)) return { error: "Too many attempts. Please wait a few minutes." };
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const claim = String(formData.get("claim") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  try {
    const supabase = await getAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user) {
      return {
        error: /confirm/i.test(error?.message ?? "")
          ? "Please confirm your email first. Check your inbox for the link."
          : "Incorrect email or password.",
      };
    }
    if (claim) await claimWithToken(claim, data.user.id);
    refresh();
    redirect(next);
  } catch (err) {
    if (isRedirect(err)) throw err;
    console.error("login failed", err);
    return { error: "We couldn't sign you in. Please try again." };
  }
}

export async function logoutAction() {
  try {
    await (await getAuthClient()).auth.signOut();
  } catch {
    // ignore: cookies are cleared below by redirecting
  }
  refresh();
  redirect("/");
}

function isRedirect(err: unknown) {
  return typeof err === "object" && err !== null && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}

/* ------------------------------ owner: listings ------------------------------ */

const TRANSITIONS: Record<string, { from: string[]; to: string; paused?: boolean }> = {
  pause: { from: ["approved"], to: "inactive", paused: true },
  resume: { from: ["inactive"], to: "approved", paused: false },
  rented: { from: ["approved"], to: "rented" },
  available: { from: ["rented"], to: "approved" },
};

export async function ownerSetListingStatus(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  const rule = TRANSITIONS[action];
  const state = await ownedListingState(user.id, id);
  if (!rule || !state || !rule.from.includes(state.status)) throw new Error("That change isn't allowed.");
  // An admin-deactivated listing (not paused by the owner) can't be resumed by the owner.
  if (action === "resume" && !state.paused_by_owner) throw new Error("Please contact us to reactivate this listing.");

  const { error } = await getAdminClient()
    .from("clothing_listings")
    .update({ status: rule.to, ...(rule.paused !== undefined ? { paused_by_owner: rule.paused } : {}) })
    .eq("id", id);
  if (error) throw error;
  refresh();
}

export async function ownerDeleteListing(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!(await ownedListingState(user.id, id))) throw new Error("Not found.");
  await deleteListingAndFiles(id);
  refresh();
  redirect("/account");
}

export async function ownerUpdateListing(_prev: EditState, formData: FormData): Promise<EditState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const state = await ownedListingState(user.id, id);
  if (!state) return { error: "Listing not found." };

  const values = Object.fromEntries(Array.from(formData.entries()).filter(([, v]) => typeof v === "string"));
  const parsed = ownerEditSchema.safeParse(values);
  if (!parsed.success) return { error: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const db = getAdminClient();

  const { error: ownerError } = await db
    .from("users")
    .update({ whatsapp_number: v.whatsapp, mobile: v.whatsapp, city: v.city, area: v.area })
    .eq("id", state.owner_id)
    .eq("auth_user_id", user.id);
  if (ownerError) return { error: "We couldn't save your changes. Please try again." };

  const { error } = await db
    .from("clothing_listings")
    .update({
      name: v.name,
      description: v.description ?? "",
      location: `${v.area}, ${v.city}`,
      city: v.city,
      size: v.sizes.join(", "),
      sizes: v.sizes,
      owner_rent_price: v.rentPrice,
      owner_sale_price: v.forSale ? (v.salePrice ?? null) : null,
      ...listingPrices(v.rentPrice, v.forSale ? (v.salePrice ?? null) : null, Number(state.margin_percent)),
      for_sale: v.forSale,
      available_dates: v.availableDates,
      available_from: v.availableDates[0],
      available_to: v.availableDates[v.availableDates.length - 1],
      // A rejected listing goes back for review once the owner has fixed it.
      ...(state.status === "rejected" ? { status: "pending" } : {}),
    })
    .eq("id", id);
  if (error) return { error: "We couldn't save your changes. Please try again." };

  refresh();
  return { ok: true };
}

