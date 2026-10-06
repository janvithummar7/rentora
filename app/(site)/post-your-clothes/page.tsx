import type { Metadata } from "next";
import { ListingForm } from "@/components/ListingForm";

export const metadata: Metadata = {
  title: "Put Your Clothes for Rent",
  description:
    "List your choli, saree, kurti, lehenga or dress for rent and earn extra income. Free to list, reviewed by our team before it goes live.",
  alternates: { canonical: "/post-your-clothes" },
};

export default function PostYourClothesPage() {
  return (
    <div className="container-page max-w-3xl py-10">
      <header className="mb-8">
        <p className="eyebrow">Owners</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-5xl">Put Your Clothes for Rent</h1>
        <p className="mt-3 text-lg text-muted">Turn your unused clothes into extra income.</p>
      </header>
      <div className="card p-5 sm:p-8">
        <ListingForm />
      </div>
    </div>
  );
}
