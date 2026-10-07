"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SITE_NAME } from "@/lib/site";
import { platformWhatsAppLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/clothes", label: "Browse" },
  { href: "/post-your-clothes", label: "Post Your Clothes" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wa = platformWhatsAppLink();

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-sand-dark/60 bg-cream/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
          {SITE_NAME}
          <span className="text-rose">.</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "text-sm font-medium transition-colors hover:text-rose",
                isActive(item.href) ? "text-rose" : "text-ink/80",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/account"
            aria-current={pathname.startsWith("/account") ? "page" : undefined}
            className="hidden px-2 text-sm font-medium text-ink/80 hover:text-rose md:inline"
          >
            My account
          </Link>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa hidden !min-h-10 !px-4 sm:inline-flex"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Connect on WhatsApp
            </a>
          )}
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sand-dark md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-sand-dark/60 bg-cream md:hidden">
          <div className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-xl px-2 py-3 text-base font-medium",
                  isActive(item.href) ? "text-rose" : "text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/account" className="rounded-xl px-2 py-3 text-base font-medium">
              My account
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-wa mt-2">
                <WhatsAppIcon className="h-5 w-5" />
                Connect on WhatsApp
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

