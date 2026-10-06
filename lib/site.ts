export const SITE_NAME = "Rentora";
export const SITE_TAGLINE = "Clothes for Rent | Choli, Saree, Kurti & Dresses";
export const SITE_DESCRIPTION =
  "Rent beautiful cholis, sarees, kurtis, lehengas, gowns and dresses. List your own clothes for rent and connect directly with renters.";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
// Platform WhatsApp number (digits, with country code). Empty string disables the buttons.
export const PLATFORM_WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
