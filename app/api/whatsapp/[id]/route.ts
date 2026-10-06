import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { generateWhatsAppLink } from "@/lib/whatsapp";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * "WhatsApp Owner" button target. The owner's number is looked up server-side and the
 * visitor is redirected to wa.me, so the number never appears in page HTML or props.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const home = new URL("/clothes", req.url);

  if (!UUID.test(id) || !rateLimit(`wa:${clientIp(req.headers)}`, 30, 10 * 60_000)) {
    return NextResponse.redirect(home, 302);
  }

  try {
    const { data } = await getAdminClient()
      .from("clothing_listings")
      .select("name,status,owner:users!owner_id(whatsapp_number)")
      .eq("id", id)
      .maybeSingle();
    const owner = data?.owner as unknown as { whatsapp_number: string } | null | undefined;
    if (!data || data.status !== "approved" || !owner) return NextResponse.redirect(home, 302);

    const url = generateWhatsAppLink(
      owner.whatsapp_number,
      `Hi, I am interested in renting your ${data.name}. Is it available?`,
    );
    return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("whatsapp redirect failed", err);
    return NextResponse.redirect(home, 302);
  }
}
