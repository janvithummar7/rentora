import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms for using the platform as a renter or an owner.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl space-y-5 py-12 leading-relaxed [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6">
      <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Terms &amp; Conditions</h1>
      <p className="text-sm text-muted">
        Template text. Have it reviewed and adapted to your business before launch.
      </p>
      <h2>Our role</h2>
      <p>
        {SITE_NAME} is a rental coordination service. Owners list items and set the price they want to receive; the price shown to renters includes our service fee. Our team confirms availability and arranges pickup, payment and returns. This website does
        not process online payments.
      </p>
      <h2>Owners</h2>
      <ul>
        <li>You must own, or have the right to rent out, the items you list.</li>
        <li>Listings are reviewed and may be rejected or removed at our discretion.</li>
        <li>Photos and descriptions must be accurate.</li>
      </ul>
      <h2>Renters</h2>
      <ul>
        <li>Provide a correct name and mobile number in your request.</li>
        <li>Care for rented items and return them on the agreed date.</li>
      </ul>
      <h2>Liability</h2>
      <p>
        We do not guarantee availability, quality or the conduct of any user and are not liable for disputes between
        renters and owners.
      </p>
    </div>
  );
}
