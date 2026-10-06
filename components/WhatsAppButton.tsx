import { platformWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.37.69 4.58 1.88 6.45L4 29l7.7-1.84a12 12 0 0 0 4.34.8C22.68 27.96 28 22.6 28 15.97 28 9.36 22.68 3 16.04 3Zm0 21.9c-1.4 0-2.77-.37-3.97-1.07l-.28-.17-4.57 1.09 1.1-4.45-.19-.3a9.2 9.2 0 0 1-1.4-4.88c0-5.1 4.2-9.25 9.35-9.25 5.1 0 9.3 4.15 9.3 9.25 0 5.1-4.2 9.78-9.34 9.78Zm5.4-6.97c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47a8.9 8.9 0 0 1-1.65-2.05c-.17-.3 0-.46.13-.6.13-.14.3-.35.44-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.18-.24-.57-.48-.5-.66-.5h-.56c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.7.3 1.26.48 1.69.62.72.23 1.37.2 1.88.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

/** Inline WhatsApp button that opens the platform's own WhatsApp number. */
export function PlatformWhatsAppLink({
  label = "Connect on WhatsApp",
  message,
  className,
}: {
  label?: string;
  message?: string;
  className?: string;
}) {
  const href = platformWhatsAppLink(message);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn("btn-wa", className)}>
      <WhatsAppIcon />
      {label}
    </a>
  );
}

/** Floating button, bottom-right on every page. Hidden if no platform number is configured. */
export function FloatingWhatsApp() {
  const href = platformWhatsAppLink();
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-3"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <WhatsAppIcon className="h-7 w-7 sm:h-6 sm:w-6" />
      <span className="hidden text-sm font-semibold sm:inline">Chat with us</span>
    </a>
  );
}
