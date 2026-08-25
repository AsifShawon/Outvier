/**
 * formatters.ts — Standardized, Locale-Safe Formatters for Outvier.
 * Ensures consistent presentation of currency (AUD), percentages, durations,
 * and dates across cards, comparison tables, and analytics.
 */

export function formatCurrencyAud(amount: number | null | undefined, fallback: string = 'N/A'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return fallback;
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(rate: number | null | undefined, fallback: string = 'N/A'): string {
  if (rate === null || rate === undefined || isNaN(rate)) {
    return fallback;
  }
  return `${Math.round(rate * 10) / 10}%`;
}

export function formatDurationWeeks(weeks: number | null | undefined): string {
  if (!weeks || isNaN(weeks)) return '2 Years Full-Time';
  const years = Math.round((weeks / 52) * 10) / 10;
  return `${years} ${years === 1 ? 'Year' : 'Years'} Full-Time`;
}

export function formatSafeDate(date: string | Date | null | undefined, fallback: string = 'Varies'): string {
  if (!date) return fallback;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;
    return new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return fallback;
  }
}
