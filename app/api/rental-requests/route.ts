import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, rentalRequestSchema } from "@/lib/validations";
import { generateWhatsAppLink, rentalRequestMessage } from "@/lib/whatsapp";

export const runtime = "nodejs";

const fail = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status });

export async function POST(req: Request) {
  if (!rateLimit(`rr:${clientIp(req.headers)}`, 10, 10 * 60_000)) {
    return fail("Too many requests. Please wait a few minutes and try again.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  // Honeypot: real users never see or fill this field. Pretend success to bots.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true, requestId: null, whatsappUrl: null });
  }

  const parsed = rentalRequestSchema.safeParse(body);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return fail(Object.values(errors)[0] ?? "Please check the form.", 400, { fieldErrors: errors });
  }
  const input = parsed.data;

  try {
    const db = getAdminClient();

    const { data: listing, error: listingError } = await db
      .from("clothing_listings")
      .select("id,name,status,available_from,available_to,owner:users!owner_id(whatsapp_number)")
      .eq("id", input.listingId)
      .maybeSingle();
    if (listingError) throw listingError;
    if (!listing || listing.status !== "approved") {
      return fail("This item is no longer available for rent.", 404);
    }
    if (
      (listing.available_from && input.startDate < listing.available_from) ||
      (listing.available_to && input.endDate > listing.available_to)
    ) {
      return fail("The owner has not made this item available for those dates. Please choose different dates.", 400, {
        fieldErrors: { startDate: "Please choose dates within the item's availability." },
      });
    }

    // Database-backed abuse limit per mobile number (works across serverless instances).
    const since = new Date(Date.now() - 60 * 60_000).toISOString();
    const { count, error: countError } = await db
      .from("rental_requests")
      .select("id", { count: "exact", head: true })
      .eq("customer_mobile", input.customerMobile)
      .gte("created_at", since);
    if (countError) throw countError;
    if ((count ?? 0) >= 5) {
      return fail("You have sent several requests recently. Please wait a while before sending more.", 429);
    }

    const { data: created, error: insertError } = await db
      .from("rental_requests")
      .insert({
        listing_id: listing.id,
        customer_name: input.customerName,
        customer_mobile: input.customerMobile,
        customer_email: input.customerEmail ?? null,
        start_date: input.startDate,
        end_date: input.endDate,
        message: input.message ?? null,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const owner = listing.owner as unknown as { whatsapp_number: string } | null;
    const whatsappUrl = owner
      ? generateWhatsAppLink(
          owner.whatsapp_number,
          rentalRequestMessage({
            clothingName: listing.name,
            customerName: input.customerName,
            customerMobile: input.customerMobile,
            startDate: input.startDate,
            endDate: input.endDate,
            note: input.message,
          }),
        )
      : null;

    return NextResponse.json({ ok: true, requestId: created.id, whatsappUrl });
  } catch (err) {
    console.error("rental-requests POST failed", err);
    return fail("We couldn't send your request. Please try again.", 500);
  }
}
