import type { Metadata } from "next";
import { PlatformWhatsAppLink } from "@/components/WhatsAppButton";
import { PLATFORM_WHATSAPP, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about renting or listing clothes? Chat with us on WhatsApp.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-page max-w-2xl py-12">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-5xl">We&apos;re on WhatsApp</h1>
      <p className="mt-4 text-lg text-muted">
        Questions about renting an outfit or listing yours on {SITE_NAME}? Message us and we&apos;ll get back to you.
      </p>
      <div className="mt-8">
        {PLATFORM_WHATSAPP ? (
          <PlatformWhatsAppLink className="btn-lg" />
        ) : (
          <p className="rounded-xl bg-gold-soft px-4 py-3 text-sm">
            WhatsApp contact isn&apos;t set up yet. Set <code>NEXT_PUBLIC_WHATSAPP_NUMBER</code> in your environment.
          </p>
        )}
      </div>
    </div>
  );
}
