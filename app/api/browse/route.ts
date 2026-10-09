import { NextResponse } from "next/server";
import { getListings } from "@/lib/data";

export const runtime = "nodejs";

/** Public, read-only: the next page of browse results for the "Show more" button. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const page = Math.min(200, Math.max(1, Number(sp.get("page")) || 1));
  try {
    const { listings, total } = await getListings({
      category: sp.get("category") ?? undefined,
      q: sp.get("q") ?? undefined,
      city: sp.get("city") ?? undefined,
      size: sp.get("size") ?? undefined,
      price: sp.get("price") ?? undefined,
      sort: sp.get("sort") ?? undefined,
      page,
    });
    return NextResponse.json({ ok: true, listings, total }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("browse api failed", err);
    return NextResponse.json({ ok: false, error: "We couldn't load more clothes. Please try again." }, { status: 500 });
  }
}
