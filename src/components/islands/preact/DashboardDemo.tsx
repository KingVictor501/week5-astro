/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import './demos.css';
import { titleCase } from '../../../lib/titleCase';

// A sample marketing dashboard with made-up numbers (labeled "Illustrative example").
// Switch between a small service business and a local shop, and between 30 and 90 days. One series per chart,
// one hue, values written as text, plus a table view so nothing depends on seeing the chart.

type Business = 'service' | 'shop';
type Range = 30 | 90;

interface Dataset {
  kpis: { label: string; value: string }[];
  sourcesTitle: string;
  sources: { label: string; value: number; ai?: boolean }[];
  trendTitle: string;
  trend: number[];
}

const DATA: Record<Business, Record<Range, Dataset>> = {
  service: {
    30: {
      kpis: [
        { label: 'New inquiries', value: '64' },
        { label: 'Jobs quoted', value: '22' },
        { label: 'Jobs booked', value: '9' },
        { label: 'Cost per booked job', value: '$58' },
      ],
      sourcesTitle: 'Where inquiries came from',
      sources: [
        { label: 'Google search', value: 21 },
        { label: 'Google Business Profile', value: 15 },
        { label: 'Referrals', value: 12 },
        { label: 'Google Ads', value: 9 },
        { label: 'AI assistants (ChatGPT and others)', value: 4, ai: true },
        { label: 'Facebook', value: 3 },
      ],
      trendTitle: 'Inquiries per week',
      trend: [13, 15, 17, 19],
    },
    90: {
      kpis: [
        { label: 'New inquiries', value: '181' },
        { label: 'Jobs quoted', value: '63' },
        { label: 'Jobs booked', value: '24' },
        { label: 'Cost per booked job', value: '$61' },
      ],
      sourcesTitle: 'Where inquiries came from',
      sources: [
        { label: 'Google search', value: 58 },
        { label: 'Google Business Profile', value: 41 },
        { label: 'Referrals', value: 36 },
        { label: 'Google Ads', value: 27 },
        { label: 'AI assistants (ChatGPT and others)', value: 10, ai: true },
        { label: 'Facebook', value: 9 },
      ],
      trendTitle: 'Inquiries per week',
      trend: [12, 13, 13, 14, 15, 14, 16, 15, 17, 18, 15, 19],
    },
  },
  shop: {
    30: {
      kpis: [
        { label: 'Website visits', value: '3,480' },
        { label: 'Calls and directions', value: '412' },
        { label: 'Online orders', value: '186' },
        { label: 'Online order revenue', value: '$7,940' },
      ],
      sourcesTitle: 'Where online orders came from',
      sources: [
        { label: 'Google Business Profile', value: 62 },
        { label: 'Instagram', value: 41 },
        { label: 'Google search', value: 38 },
        { label: 'Facebook', value: 22 },
        { label: 'Email list', value: 15 },
        { label: 'AI assistants (ChatGPT and others)', value: 8, ai: true },
      ],
      trendTitle: 'Online orders per week',
      trend: [39, 44, 48, 55],
    },
    90: {
      kpis: [
        { label: 'Website visits', value: '9,870' },
        { label: 'Calls and directions', value: '1,166' },
        { label: 'Online orders', value: '497' },
        { label: 'Online order revenue', value: '$21,310' },
      ],
      sourcesTitle: 'Where online orders came from',
      sources: [
        { label: 'Google Business Profile', value: 168 },
        { label: 'Instagram', value: 109 },
        { label: 'Google search', value: 102 },
        { label: 'Facebook', value: 61 },
        { label: 'Email list', value: 38 },
        { label: 'AI assistants (ChatGPT and others)', value: 19, ai: true },
      ],
      trendTitle: 'Online orders per week',
      trend: [31, 34, 36, 35, 39, 41, 40, 43, 46, 45, 51, 56],
    },
  },
};

// Trend chart geometry (viewBox units).
const W = 320;
const H = 110;
const PAD = { top: 10, right: 8, bottom: 20, left: 8 };

function Trend({ values, title }: { values: number[]; title: string }) {
  const [tip, setTip] = useState<string>('');
  const max = Math.max(...values) * 1.15;
  const x = (i: number) => PAD.left + (i * (W - PAD.left - PAD.right)) / (values.length - 1);
  const y = (v: number) => PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const first = values[0];
  const last = values[values.length - 1];

  return (
    <div>
      <svg
        class="dash-trend"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title}: from ${first} in week 1 to ${last} in week ${values.length}.`}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line class="grid" x1={PAD.left} x2={W - PAD.right} y1={PAD.top + f * (H - PAD.top - PAD.bottom)} y2={PAD.top + f * (H - PAD.top - PAD.bottom)} />
        ))}
        <polyline class="line" points={points} />
        {values.map((v, i) => (
          <g key={i}>
            <circle
              class="dot-hit"
              cx={x(i)}
              cy={y(v)}
              r={12}
              tabIndex={-1}
              onMouseEnter={() => setTip(`Week ${i + 1}: ${v}`)}
              onMouseLeave={() => setTip('')}
            />
            <circle class="dot" cx={x(i)} cy={y(v)} r={4} />
          </g>
        ))}
        <text x={PAD.left} y={H - 4}>Week 1</text>
        <text x={W - PAD.right} y={H - 4} text-anchor="end">
          Week {values.length}
        </text>
      </svg>
      <p class="dash-tip" aria-hidden="true">
        {tip || 'Hover a point to see that week.'}
      </p>
    </div>
  );
}

export default function DashboardDemo() {
  const [business, setBusiness] = useState<Business>('service');
  const [range, setRange] = useState<Range>(30);
  const [table, setTable] = useState(false);
  const d = DATA[business][range];
  const max = Math.max(...d.sources.map((s) => s.value));

  return (
    <div class="demo">
      <div class="demo-head">
        <p class="demo-title">Sample Marketing Dashboard</p>
        <span class="demo-tag">Illustrative example</span>
      </div>

      <div class="demo-seg" role="group" aria-label="Type of business">
        <button type="button" aria-pressed={business === 'service'} onClick={() => setBusiness('service')}>
          Small business
        </button>
        <button type="button" aria-pressed={business === 'shop'} onClick={() => setBusiness('shop')}>
          Local shop
        </button>
      </div>
      <div class="demo-seg" role="group" aria-label="Date range">
        <button type="button" aria-pressed={range === 30} onClick={() => setRange(30)}>
          Last 30 days
        </button>
        <button type="button" aria-pressed={range === 90} onClick={() => setRange(90)}>
          Last 90 days
        </button>
      </div>

      <dl class="dash-kpis">
        {d.kpis.map((k) => (
          <div class="dash-kpi">
            <dt>{k.label}</dt>
            <dd>{k.value}</dd>
          </div>
        ))}
      </dl>

      {/* Collapsible breakdown (native details/summary: keyboard and screen-reader friendly, works without JS). */}
      <details class="dash-collapse">
        <summary>
          <span class="dash-section-title">{titleCase(d.sourcesTitle)}</span>
          <span class="dash-collapse-cue">
            <span class="when-closed">Show breakdown</span>
            <span class="when-open">Hide</span>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </summary>
        <div class="dash-collapse-body">
          {table ? (
            <table class="dash-table">
              <thead>
                <tr>
                  <th scope="col">Source</th>
                  <th scope="col">Count</th>
                </tr>
              </thead>
              <tbody>
                {d.sources.map((s) => (
                  <tr>
                    <td>{s.label}</td>
                    <td>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <ul class="dash-bars">
              {d.sources.map((s) => (
                <li class={s.ai ? 'dash-bar dash-bar-ai' : 'dash-bar'}>
                  <span class="dash-bar-label">{s.label}</span>
                  <span class="dash-bar-track" aria-hidden="true">
                    <span class="dash-bar-fill" style={{ width: `${(s.value / max) * 100}%`, display: 'block' }} />
                  </span>
                  <span class="dash-bar-value">{s.value}</span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" class="demo-btn" aria-pressed={table} onClick={() => setTable(!table)}>
            {table ? 'Show as chart' : 'Show as table'}
          </button>
        </div>
      </details>

      <p class="dash-section-title">{titleCase(d.trendTitle)}</p>
      <Trend values={d.trend} title={d.trendTitle} />
    </div>
  );
}
