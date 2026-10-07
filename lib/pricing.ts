/** Price shown to customers: the owner's price plus the platform margin, rounded up to a whole rupee. */
export function applyMargin(ownerPrice: number, marginPercent: number): number {
  return Math.ceil(ownerPrice * (1 + marginPercent / 100) - 1e-9);
}

export function clampMargin(value: number): number {
  return Number.isFinite(value) ? Math.min(300, Math.max(0, Math.round(value * 100) / 100)) : 0;
}

/** Prices for a listing from the owner's prices and a margin. */
export function listingPrices(ownerRent: number, ownerSale: number | null | undefined, marginPercent: number) {
  return {
    rent_price: applyMargin(ownerRent, marginPercent),
    sale_price: ownerSale ? applyMargin(ownerSale, marginPercent) : null,
  };
}

/** Money breakdown for a rental of `days` days: what the customer pays, what the owner gets, platform margin. */
export function rentalTotals(p: { rentPrice: number; ownerRentPrice: number; days: number }) {
  const customer = p.rentPrice * p.days;
  const owner = p.ownerRentPrice * p.days;
  return { customer, owner, margin: customer - owner };
}
