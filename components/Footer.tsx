import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { platformWhatsAppLink } from "@/lib/whatsapp";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/clothes", label: "Browse" },
  { href: "/post-your-clothes", label: "Post Your Clothes" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/contact", label: "Contact" },
  { href: "/account", label: "Owner account" },
];

export function Footer() {
  const wa = platformWhatsAppLink();
  return (
    <footer className="mt-16 border-t border-sand-dark/60 bg-sand/60 pb-24 sm:pb-10">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-serif text-2xl font-semibold">
            {SITE_NAME}
            <span className="text-rose">.</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            A simple way to rent beautiful traditional and occasion wear, or earn from the outfits sitting unused in
            your wardrobe. Our team coordinates every rental for you on WhatsApp.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="eyebrow">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink/80 hover:text-rose">
                  {l.label}
                </Link>
              </li>
            ))}
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="text-ink/80 hover:text-rose">
                  WhatsApp
                </a>
              </li>
            )}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="eyebrow">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/privacy-policy" className="text-ink/80 hover:text-rose">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-ink/80 hover:text-rose">
                Terms &amp; Conditions
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="container-page border-t border-sand-dark/60 py-5 text-xs text-muted">
        © {new Date().getFullYear()} {SITE_NAME}. Every rental is coordinated by our team.
      </div>
    </footer>
  );
}
