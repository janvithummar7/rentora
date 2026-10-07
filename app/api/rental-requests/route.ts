import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, rentalRequestSchema } from "@/lib/validations";
import { PLATFORM_WHATSAPP } from "@/lib/site";
import { generateWhatsAppLink, rentalRequestMessage } from "@/lib/whatsapp";
import { shortId } from "@/lib/utils";
import { daysBetween } from "@/lib/dates";

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
      .select("id,name,status,available_dates,rent_price")
      .eq("id", input.listingId)
      .maybeSingle();
    if (listingError) throw listingError;
    if (!listing || listing.status !== "approved") {
      return fail("This item is no longer available for rent.", 404);
    }
    // Every day of the stay must be one the owner marked as available.
    const available = new Set<string>((listing.available_dates as string[] | null) ?? []);
    const stay = daysBetween(input.startDate, input.endDate);
    if (stay.length > 60 || stay.some((d) => !available.has(d))) {
      const msg = "Some of those dates are not available. Please pick days marked as available.";
      return fail(msg, 400, { fieldErrors: { startDate: msg } });
    }

    // Dates taken by a confirmed or completed order are occupied.
    const { count: clash, error: clashError } = await db
      .from("rental_requests")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listing.id)
      .in("status", ["confirmed", "completed"])
      .lte("start_date", input.endDate)
      .gte("end_date", input.startDate);
    if (clashError) throw clashError;
    if ((clash ?? 0) > 0) {
      const msg = "Some of those dates have just been booked. Please pick other dates.";
      return fail(msg, 409, { fieldErrors: { startDate: msg } });
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

    // Requests go to the platform's WhatsApp (not the owner), so the team can add the margin and coordinate.
    const whatsappUrl = PLATFORM_WHATSAPP
      ? generateWhatsAppLink(
          PLATFORM_WHATSAPP,
          rentalRequestMessage({
            clothingName: listing.name,
            ref: shortId(listing.id),
            customerName: input.customerName,
            customerMobile: input.customerMobile,
            startDate: input.startDate,
            endDate: input.endDate,
            listedPrice: listing.rent_price,
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
