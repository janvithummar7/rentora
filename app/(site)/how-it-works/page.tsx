import type { Metadata } from "next";
import Link from "next/link";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Renting or listing clothes is simple: find an outfit, send a request, and connect with the owner on WhatsApp. No online payment, no sign-up.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <div className="container-page py-10">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow">Simple by design</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-5xl">How It Works</h1>
        <p className="mt-3 text-lg text-muted">
          We connect renters and owners. You agree on pickup, price and payment directly, on WhatsApp.
        </p>
      </header>
      <HowItWorksSteps />
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/clothes" className="btn-primary btn-lg">
          GET CLOTHES FOR RENT
        </Link>
        <Link href="/post-your-clothes" className="btn-outline btn-lg">
          PUT YOUR CLOTHES FOR RENT
        </Link>
      </div>
    </div>
  );
}
