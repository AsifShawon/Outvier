import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function formatCurrencyAud(amount: number | null | undefined, fallback: string = 'N/A'): string {
  if (amount === null || amount === undefined || isNaN(amount)) return fallback;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(rate: number | null | undefined, fallback: string = 'N/A'): string {
  if (rate === null || rate === undefined || isNaN(rate)) return fallback;
  return `${Math.round(rate * 10) / 10}%`;
}

function formatDurationWeeks(weeks: number | null | undefined): string {
  if (!weeks || isNaN(weeks)) return '2 Years Full-Time';
  const years = Math.round((weeks / 52) * 10) / 10;
  return `${years} ${years === 1 ? 'Year' : 'Years'} Full-Time`;
}

describe('Formatters & Sanitizers Test Suite', () => {
  describe('Currency & Numbers', () => {
    it('formats numbers into AUD currency string correctly', () => {
      const formatted = formatCurrencyAud(45000);
      assert.ok(formatted.includes('45,000') || formatted.includes('45000'), 'Formatted AUD string should contain 45,000');
    });

    it('handles null, undefined, and NaN with custom fallbacks without fabricating zeroes', () => {
      assert.equal(formatCurrencyAud(null), 'N/A');
      assert.equal(formatCurrencyAud(undefined), 'N/A');
      assert.equal(formatCurrencyAud(NaN, 'Contact for fee'), 'Contact for fee');
    });
  });

  describe('Percentages & Durations', () => {
    it('formats percentages with 1 decimal precision', () => {
      assert.equal(formatPercent(88.42), '88.4%');
      assert.equal(formatPercent(90), '90%');
      assert.equal(formatPercent(null), 'N/A');
    });

    it('calculates duration in years from CRICOS duration weeks', () => {
      assert.equal(formatDurationWeeks(104), '2 Years Full-Time');
      assert.equal(formatDurationWeeks(52), '1 Year Full-Time');
      assert.equal(formatDurationWeeks(156), '3 Years Full-Time');
      assert.equal(formatDurationWeeks(undefined), '2 Years Full-Time');
    });
  });
});
