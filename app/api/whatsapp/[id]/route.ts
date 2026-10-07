import { NextResponse } from "next/server";
import { getPublicClient } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { PLATFORM_WHATSAPP } from "@/lib/site";
import { shortId } from "@/lib/utils";
import { buyMessage, generateWhatsAppLink, inquiryMessage } from "@/lib/whatsapp";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * "WhatsApp" button target for an item. Enquiries go to the PLATFORM's WhatsApp number (the owner
 * is never contacted directly), with the item name and reference in the message.
 * ?intent=buy asks about buying instead of renting.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buy = new URL(req.url).searchParams.get("intent") === "buy";
  const fallback = new URL(PLATFORM_WHATSAPP ? "/clothes" : "/contact", req.url);

  if (!PLATFORM_WHATSAPP || !UUID.test(id) || !rateLimit(`wa:${clientIp(req.headers)}`, 30, 10 * 60_000)) {
    return NextResponse.redirect(fallback, 302);
  }

  try {
    // Public view: only approved listings, only customer-facing data.
    const { data } = await getPublicClient()
      .from("public_listings")
      .select("name,for_sale,sale_price")
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.redirect(fallback, 302);

    const ref = shortId(id);
    const message = buy && data.for_sale ? buyMessage(data.name, ref, data.sale_price) : inquiryMessage(data.name, ref);
    return NextResponse.redirect(generateWhatsAppLink(PLATFORM_WHATSAPP, message), {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("whatsapp redirect failed", err);
    return NextResponse.redirect(fallback, 302);
  }
}
