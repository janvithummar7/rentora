import type { Metadata } from "next";
import Link from "next/link";
import { ListingForm } from "@/components/ListingForm";
import { getCurrentUser } from "@/lib/account-auth";
import { getAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Put Your Clothes for Rent",
  description:
    "List your choli, saree, kurti, lehenga or dress for rent and earn extra income. Free to list, reviewed by our team before it goes live.",
  alternates: { canonical: "/post-your-clothes" },
};

export default async function PostYourClothesPage() {
  // If the owner is signed in, prefill their details and attach the listing to their account.
  const user = await getCurrentUser();
  let defaults: { ownerName?: string; whatsapp?: string; city?: string; area?: string } | undefined;
  if (user) {
    try {
      const { data } = await getAdminClient()
        .from("users")
        .select("name,whatsapp_number,city,area")
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        defaults = { ownerName: data.name, whatsapp: data.whatsapp_number, city: data.city ?? undefined, area: data.area ?? undefined };
      }
    } catch {
      // prefill is a convenience only
    }
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <header className="mb-8">
        <p className="eyebrow">Owners</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-5xl">Put Your Clothes for Rent</h1>
        <p className="mt-3 text-lg text-muted">Turn your unused clothes into extra income.</p>
        {user && (
          <p className="mt-3 rounded-xl bg-gold-soft px-4 py-2 text-sm">
            Posting as <span className="font-medium">{user.email}</span>. This listing will be saved to your{" "}
            <Link href="/account" className="font-semibold text-rose hover:underline">
              account
            </Link>
            .
          </p>
        )}
      </header>
      <div className="card p-5 sm:p-8">
        <ListingForm defaults={defaults} />
      </div>
    </div>
  );
}
