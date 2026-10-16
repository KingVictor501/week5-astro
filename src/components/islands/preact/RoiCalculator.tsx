import { useEffect, useState } from 'preact/hooks';
import type { TargetedEvent } from 'preact';
import { calculateRoi, parseNumber, validateField, type RoiField, type RoiInputs } from '../../../lib/roi';
import './RoiCalculator.css';

interface Props {
  ctaHref: string;
}

const DEFAULTS: Record<RoiField, string> = {
  monthlySpend: '3,000',
  costPerClick: '3.00',
  conversionRate: '5',
  customerValue: '500',
  wastedPercent: '25',
};

const TEXT_FIELDS: { field: Exclude<RoiField, 'wastedPercent'>; label: string; hint: string; prefix?: string; suffix?: string }[] = [
  { field: 'monthlySpend', label: 'Monthly ad spend', hint: 'Total spent on paid search per month.', prefix: '$' },
  { field: 'costPerClick', label: 'Average cost per click', hint: 'Found in your Google Ads account.', prefix: '$' },
  { field: 'conversionRate', label: 'Conversion rate', hint: 'Percent of clicks that become customers.', suffix: '%' },
  { field: 'customerValue', label: 'Average customer value', hint: 'Revenue from a typical new customer.', prefix: '$' },
];

const FIELDS = Object.keys(DEFAULTS) as RoiField[];
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const decimal = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });

export default function RoiCalculator({ ctaHref }: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(DEFAULTS);
  const [touched, setTouched] = useState<Partial<Record<RoiField, boolean>>>({});
  const [tipOpen, setTipOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const errors = Object.fromEntries(FIELDS.map((f) => [f, validateField(f, values[f])])) as Record<RoiField, string | null>;
  const valid = FIELDS.every((f) => errors[f] === null);
  const inputs = valid
    ? (Object.fromEntries(FIELDS.map((f) => [f, parseNumber(values[f])])) as unknown as RoiInputs)
    : null;
  const results = inputs ? calculateRoi(inputs) : null;

  // Announce a summary once typing pauses, instead of on every keystroke.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setAnnouncement(
        results
          ? `Estimated wasted spend: ${money(results.monthlyWaste)} per month, ${money(results.yearlyWaste)} per year. ` +
              `About ${decimal(results.leadsLostPerMonth)} leads lost per month. ` +
              `Revenue opportunity: ${money(results.monthlyRevenueOpportunity)} per month.`
          : 'Fix the highlighted fields to see your estimate.',
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [open, values]);

  const update = (field: RoiField) => (event: TargetedEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setValues((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const markTouched = (field: RoiField) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  const onTipKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && tipOpen) {
      event.stopPropagation();
      setTipOpen(false);
    }
  };

  return (
    <div class="roi-card" data-open={open ? '' : undefined}>
      <div class="roi-intro">
        <h2 id="roi-title">How Much Are You Losing to Bad Ad Practices?</h2>
        <p class="roi-teaser">
          Plug in a few numbers from your ad account and see what wasted clicks may be costing you every month.
        </p>
        <button
          type="button"
          class="btn btn-primary btn-lg"
          aria-expanded={open}
          aria-controls="roi-panel"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Hide calculator' : 'Calculate my losses'}
        </button>
      </div>

      {/* Collapsed content is inert: not focusable, not read by screen readers. */}
      <div id="roi-panel" class="roi-panel" inert={!open}>
        <div class="roi-panel-inner">
          <div class="roi-form">
            <fieldset>
              <legend class="visually-hidden">Your ad account numbers</legend>
              <div class="roi-fields">
                {TEXT_FIELDS.map(({ field, label, hint, prefix, suffix }) => {
                  const showError = touched[field] && errors[field];
                  return (
                    <div class="roi-field" key={field}>
                      <label for={`roi-${field}`}>{label}</label>
                      <p id={`roi-${field}-hint`} class="roi-hint">
                        {hint}
                      </p>
                      <div class={`roi-input${showError ? ' roi-input-error' : ''}`}>
                        {prefix && <span aria-hidden="true">{prefix}</span>}
                        <input
                          id={`roi-${field}`}
                          name={field}
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={values[field]}
                          onInput={update(field)}
                          onBlur={markTouched(field)}
                          aria-invalid={showError ? true : undefined}
                          aria-describedby={`roi-${field}-hint${showError ? ` roi-${field}-error` : ''}`}
                        />
                        {suffix && <span aria-hidden="true">{suffix}</span>}
                      </div>
                      {showError && (
                        <p id={`roi-${field}-error`} class="roi-error">
                          {errors[field]}
                        </p>
                      )}
                    </div>
                  );
                })}

                <div class="roi-field roi-field-wide">
                  <div class="roi-label-row">
                    <label for="roi-wastedPercent">Estimated wasted spend</label>
                    <button
                      type="button"
                      class="roi-tip-toggle"
                      aria-expanded={tipOpen}
                      aria-controls="roi-tip"
                      onClick={() => setTipOpen((t) => !t)}
                      onKeyDown={onTipKeyDown}
                    >
                      <span aria-hidden="true">?</span>
                      <span class="visually-hidden">What causes wasted ad spend?</span>
                    </button>
                    <output for="roi-wastedPercent" class="roi-slider-value">
                      {values.wastedPercent}%
                    </output>
                  </div>
                  <div id="roi-tip" class="roi-tip" hidden={!tipOpen}>
                    <p>Common causes of wasted ad spend:</p>
                    <ul>
                      <li>Bidding on broad or irrelevant keywords</li>
                      <li>No negative keywords to block bad searches</li>
                      <li>Landing pages that don't match the ad or load slowly</li>
                      <li>No conversion tracking, so budget can't follow results</li>
                    </ul>
                  </div>
                  <input
                    id="roi-wastedPercent"
                    name="wastedPercent"
                    type="range"
                    min={0}
                    max={90}
                    step={5}
                    value={values.wastedPercent}
                    onInput={update('wastedPercent')}
                    aria-valuetext={`${values.wastedPercent} percent`}
                    aria-describedby="roi-wasted-hint"
                  />
                  <p id="roi-wasted-hint" class="roi-hint">
                    Your best guess at the share of your budget that brings no business.
                  </p>
                </div>
              </div>
            </fieldset>
          </div>

          <div class="roi-results" aria-labelledby="roi-results-title" role="group">
            <h3 id="roi-results-title">Your estimate</h3>
            {results ? (
              <dl>
                <div>
                  <dt>Wasted spend per month</dt>
                  <dd>{money(results.monthlyWaste)}</dd>
                </div>
                <div>
                  <dt>Wasted spend per year</dt>
                  <dd>{money(results.yearlyWaste)}</dd>
                </div>
                <div>
                  <dt>Leads lost per month</dt>
                  <dd>{decimal(results.leadsLostPerMonth)}</dd>
                </div>
                <div class="roi-highlight">
                  <dt>Monthly revenue opportunity</dt>
                  <dd>{money(results.monthlyRevenueOpportunity)}</dd>
                </div>
              </dl>
            ) : (
              <p class="roi-invalid">Fix the highlighted fields to see your estimate.</p>
            )}

            <a class="btn btn-primary btn-lg roi-cta" href={ctaHref}>
              Get a free ad account audit
            </a>
          </div>

          <details class="roi-details">
            <summary>How we calculate this</summary>
            <ul>
              <li>
                <strong>Wasted spend per month</strong> = monthly ad spend × wasted spend %
              </li>
              <li>
                <strong>Wasted spend per year</strong> = wasted spend per month × 12
              </li>
              <li>
                <strong>Leads lost per month</strong> = (wasted spend per month ÷ cost per click) × conversion rate. In
                other words, the wasted clicks, converting at your current rate.
              </li>
              <li>
                <strong>Monthly revenue opportunity</strong> = leads lost per month × average customer value. Cutting
                waste is a conversion improvement: today your whole budget effectively converts at{' '}
                {results ? `${decimal(results.effectiveConversionRate)}%` : 'your rate × (1 − wasted %)'} instead of
                your full {results ? `${decimal(inputs!.conversionRate)}%` : ''} rate.
              </li>
            </ul>
            <p class="roi-disclaimer">
              These results are estimates for illustration only, not a guarantee. Actual waste and results depend on
              your account, market, and offer. A full audit looks at your real data.
            </p>
          </details>
        </div>
      </div>

      {/* Always in the DOM so screen readers register it before it changes. */}
      <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}
