import { PLATFORM_WHATSAPP, SITE_NAME } from "@/lib/site";
import { formatDate } from "@/lib/utils";

/**
 * Returns a 10-digit Indian mobile number from user input, or null when invalid.
 * Accepts "9876543210", "+91 98765 43210", "919876543210" and "09876543210".
 */
export function normalizeIndianMobile(input: string): string | null {
  const cleaned = input.replace(/[\s\-().]/g, "");
  const m = /^(?:\+91|91|0)?([6-9]\d{9})$/.exec(cleaned);
  return m ? m[1] : null;
}

/** Builds a click-to-chat URL. A bare 10-digit number is assumed to be Indian (+91). */
export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

/** Link to the platform's own WhatsApp number, or null when it is not configured. */
export function platformWhatsAppLink(message = "Hi, I would like to know more about renting clothes."): string | null {
  return PLATFORM_WHATSAPP ? generateWhatsAppLink(PLATFORM_WHATSAPP, message) : null;
}

/** Sent by the renter to the PLATFORM's WhatsApp number (not the owner's). */
export function rentalRequestMessage(p: {
  clothingName: string;
  ref: string;
  customerName: string;
  customerMobile: string;
  startDate: string;
  endDate: string;
  listedPrice?: number | null;
  deposit?: number | null;
  note?: string | null;
}): string {
  const lines = [
    `Hi, I would like to rent: ${p.clothingName} (Ref ${p.ref}).`,
    "",
    `Name: ${p.customerName}`,
    `Mobile: ${p.customerMobile}`,
    `Rental Date: ${formatDate(p.startDate)} to ${formatDate(p.endDate)}`,
  ];
  if (p.listedPrice) lines.push(`Listed price: ₹${p.listedPrice.toLocaleString("en-IN")} / day`);
  if (p.deposit && p.deposit > 0) {
    lines.push(`Security deposit: ₹${p.deposit.toLocaleString("en-IN")} (accepted: refundable, not returned if the outfit is damaged or broken)`);
  } else {
    lines.push("Accepted: I am responsible for any damage to the outfit.");
  }
  if (p.note) lines.push(`Note: ${p.note}`);
  lines.push("", "Please confirm availability and the total price.");
  return lines.join("\n");
}

/** Quick question about an item, sent to the platform number. */
export function inquiryMessage(clothingName: string, ref: string): string {
  return `Hi, I am interested in renting ${clothingName} (Ref ${ref}). Is it available?`;
}

/** Message the admin sends to a customer about their request. */
export function adminToCustomerMessage(p: {
  customerName: string;
  clothingName: string;
  startDate: string;
  endDate: string;
}): string {
  return `Hi ${p.customerName}, this is the ${SITE_NAME} team regarding your request for ${p.clothingName} (${formatDate(
    p.startDate,
  )} to ${formatDate(p.endDate)}). How can we help?`;
}

/** Summary an admin can forward on WhatsApp ("New Rental Request"). */
export function adminRequestSummary(p: {
  clothingName: string;
  customerName: string;
  customerMobile: string;
  startDate: string;
  endDate: string;
}): string {
  return [
    "New Rental Request",
    "",
    `Clothing: ${p.clothingName}`,
    `Customer: ${p.customerName}`,
    `Mobile: ${p.customerMobile}`,
    `Date: ${formatDate(p.startDate)} - ${formatDate(p.endDate)}`,
  ].join("\n");
}


export function buyMessage(clothingName: string, ref: string, price?: number | null): string {
  return `Hi, I am interested in buying ${clothingName} (Ref ${ref})${price ? ` listed at ₹${price.toLocaleString("en-IN")}` : ""}. Is it still available?`;
}

/** What the admin sends to an owner to check availability. Deliberately has no customer details. */
export function ownerAvailabilityMessage(p: {
  ownerName: string;
  clothingName: string;
  startDate: string;
  endDate: string;
}): string {
  return `Hi ${p.ownerName}, this is the ${SITE_NAME} team. We have a rental request for your ${p.clothingName} from ${formatDate(
    p.startDate,
  )} to ${formatDate(p.endDate)}. Is it available on those dates?`;
}
