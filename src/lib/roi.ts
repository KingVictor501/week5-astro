// Pure ROI math for the "bad ad practices" calculator. No DOM, so it can be tested directly.

export interface RoiInputs {
  /** Monthly ad spend, in dollars. */
  monthlySpend: number;
  /** Average cost per click, in dollars. */
  costPerClick: number;
  /** Conversion rate, as a percent (5 = 5%). */
  conversionRate: number;
  /** Average customer value, in dollars. */
  customerValue: number;
  /** Estimated wasted spend, as a percent (25 = 25%). */
  wastedPercent: number;
}

export interface RoiResults {
  monthlyWaste: number;
  yearlyWaste: number;
  /** Clicks per month paid for by wasted spend. */
  wastedClicks: number;
  leadsLostPerMonth: number;
  /** Monthly revenue if the wasted budget converted at the current rate. */
  monthlyRevenueOpportunity: number;
  /** Effective conversion rate of the whole budget today, as a percent. */
  effectiveConversionRate: number;
}

export function calculateRoi({ monthlySpend, costPerClick, conversionRate, customerValue, wastedPercent }: RoiInputs): RoiResults {
  const monthlyWaste = monthlySpend * (wastedPercent / 100);
  const wastedClicks = monthlyWaste / costPerClick;
  const leadsLostPerMonth = wastedClicks * (conversionRate / 100);
  return {
    monthlyWaste,
    yearlyWaste: monthlyWaste * 12,
    wastedClicks,
    leadsLostPerMonth,
    monthlyRevenueOpportunity: leadsLostPerMonth * customerValue,
    effectiveConversionRate: conversionRate * (1 - wastedPercent / 100),
  };
}

export type RoiField = keyof RoiInputs;

interface FieldRule {
  label: string;
  min: number;
  max: number;
  /** Whether the minimum itself is allowed (false for cost per click: no dividing by zero). */
  minInclusive: boolean;
}

export const FIELD_RULES: Record<RoiField, FieldRule> = {
  monthlySpend: { label: 'Monthly ad spend', min: 0, max: 10_000_000, minInclusive: false },
  costPerClick: { label: 'Average cost per click', min: 0, max: 1_000, minInclusive: false },
  conversionRate: { label: 'Conversion rate', min: 0, max: 100, minInclusive: true },
  customerValue: { label: 'Average customer value', min: 0, max: 10_000_000, minInclusive: true },
  wastedPercent: { label: 'Wasted spend', min: 0, max: 90, minInclusive: true },
};

/** Accepts "3,000", "$3000", " 5% " and similar. Returns NaN for anything else. */
export function parseNumber(raw: string): number {
  const cleaned = raw.replace(/[$,%\s]/g, '');
  if (cleaned === '' || !/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

/** Returns an error message, or null when the value is valid. */
export function validateField(field: RoiField, raw: string): string | null {
  const rule = FIELD_RULES[field];
  if (raw.trim() === '') return `Enter your ${rule.label.toLowerCase()}.`;
  const value = parseNumber(raw);
  if (Number.isNaN(value)) return 'Enter a number, like 2500 or 3.50.';
  if (rule.minInclusive ? value < rule.min : value <= rule.min) {
    return rule.minInclusive ? `Must be ${rule.min} or more.` : `Must be more than ${rule.min}.`;
  }
  if (value > rule.max) return `Must be ${rule.max.toLocaleString('en-US')} or less.`;
  return null;
}
