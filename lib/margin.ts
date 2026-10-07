import "server-only";
import { clampMargin } from "@/lib/pricing";

/** Default margin (%) for new listings. Set DEFAULT_MARGIN_PERCENT in the environment (default 25). */
export function getDefaultMargin(): number {
  const raw = process.env.DEFAULT_MARGIN_PERCENT;
  return raw && raw.trim() !== "" ? clampMargin(Number(raw)) : 25;
}
