import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we collect, use and protect your information.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl space-y-5 py-12 leading-relaxed [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6">
      <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Privacy Policy</h1>
      <p className="text-sm text-muted">
        Template text. Have it reviewed and adapted to your business before launch.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Renters: name, mobile number, optional email, rental dates and any message you write.</li>
        <li>Owners: name, mobile and WhatsApp number, optional email, city, area, listing details and photos.</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        {SITE_NAME} uses this information to show listings, handle rental requests, let our team review
        listings and contact you about a request. Owners&apos; phone numbers are never shown publicly. Renters&apos; contact details are used by our team to coordinate the rental and are not shown to other users.
      </p>
      <h2>Storage and security</h2>
      <p>
        Data is stored in a managed PostgreSQL database and file storage. Access to private data is restricted to our
        servers and administrators.
      </p>
      <h2>Your choices</h2>
      <p>To have a listing or your details removed, contact us on WhatsApp.</p>
    </div>
  );
}
