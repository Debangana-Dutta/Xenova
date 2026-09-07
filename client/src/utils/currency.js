// Single source of truth for money formatting across Xenova.
//
// Every amount in the app is stored as a plain Number in MongoDB and rendered
// through this module, so changing the locale or currency here changes it
// everywhere. Previously `formatCurrency` was duplicated in Dashboard.js and
// Finance.js, both hardcoded to en-US / USD.

export const CURRENCY_CODE = 'INR';
export const CURRENCY_SYMBOL = '\u20B9';
export const LOCALE = 'en-IN';

/**
 * Format an amount as Indian Rupees.
 *
 * Paise are only shown when the amount actually has them, so a ₹250 expense
 * reads as "₹250" rather than "₹250.00", while ₹99.50 keeps its precision.
 *
 * @param {number} amount
 * @param {{ compact?: boolean }} [options] compact uses lakh/crore notation
 *        (₹1.2L) which keeps chart axes and stat cards from wrapping.
 */
export const formatCurrency = (amount, { compact = false } = {}) => {
  const value = Number(amount);
  const safeValue = Number.isFinite(value) ? value : 0;
  const hasPaise = Math.abs(safeValue % 1) > 0.001;

  // Show exactly two decimals when paise are present, none when they aren't,
  // so ₹250 stays clean while ₹99.50 keeps its trailing zero.
  const showPaise = hasPaise && !compact;

  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: showPaise ? 2 : 0,
    maximumFractionDigits: showPaise ? 2 : compact ? 1 : 0,
  }).format(safeValue);
};

/**
 * Format a bare number with Indian digit grouping (1,00,000 not 100,000).
 * Used for chart axis ticks where a repeated ₹ symbol is just noise.
 */
export const formatNumber = (value) =>
  new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(
    Number.isFinite(Number(value)) ? Number(value) : 0
  );

/**
 * Format a date consistently across the app (en-IN gives 7 Sep 2026 ordering).
 */
export const formatDate = (date, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(LOCALE, options);
};

/**
 * Validate a user-entered amount before it reaches the API.
 * Returns an error string, or null when the value is acceptable.
 * Mirrors the Transaction schema's `min: 0.01` so the client and server agree.
 */
export const validateAmount = (raw) => {
  if (raw === '' || raw === null || raw === undefined) return 'Enter an amount';
  const value = Number(raw);
  if (!Number.isFinite(value)) return 'Enter a valid number';
  if (value <= 0) return 'Amount must be greater than zero';
  if (value > 10000000) return 'Amount looks too large — check the value';
  return null;
};
