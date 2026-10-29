/**
 * Money utilities.
 * All monetary values are stored in **paise** (1 INR = 100 paise).
 * Formatting is done at the UI edge only.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format paise as an INR currency string.
 * @param paise - Amount in paise (integer).
 * @returns Formatted string, e.g. `₹8,500`.
 */
export function formatINR(paise: number): string {
  return inrFormatter.format(Math.round(paise / 100));
}

/**
 * Convert paise to rupees (display/calculation only).
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Convert rupees to integer paise.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

