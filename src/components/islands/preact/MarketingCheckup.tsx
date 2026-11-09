/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import './demos.css';

// Homepage tool: a 60-second marketing checkup. Visitors tick what's already true for their
// business; the score ring fills and the list of next steps updates live. Native checkboxes,
// score announced politely, nothing sent or saved. Renders complete HTML on the server.

interface Check {
  id: string;
  label: string;
  fix: string;
  href: string;
  service: string;
}

const CHECKS: Check[] = [
  {
    id: 'gbp',
    label: 'My Google Business Profile is complete, with recent reviews',
    fix: 'Fill out your Google Business Profile and start asking every happy customer for a review.',
    href: '/ai-search-optimization',
    service: 'AI search optimization',
  },
  {
    id: 'ai',
    label: 'ChatGPT or Google’s AI mentions my business when asked about my service nearby',
    fix: 'Add clear, answer-first pages so AI assistants can find and recommend you.',
    href: '/ai-search-optimization',
    service: 'AI search optimization',
  },
  {
    id: 'site',
    label: 'My website loads fast on a phone and has a tap-to-call button',
    fix: 'Speed up your site and make calling or booking one tap away on a phone.',
    href: '/website-development-and-management',
    service: 'Web development',
  },
  {
    id: 'calls',
    label: 'Every missed call gets a call or text back the same day',
    fix: 'Set up an automatic text-back so missed calls turn into booked jobs.',
    href: '/ai-and-automation-consulting',
    service: 'AI and automation',
  },
  {
    id: 'track',
    label: 'I know which ads, searches, or referrals bring in my customers',
    fix: 'Track calls and form fills by source so you can see what is working.',
    href: '/marketing-analytics-and-dashboards',
    service: 'Analytics and dashboards',
  },
  {
    id: 'ads',
    label: 'My ads and social posts bring in calls, not just likes and clicks',
    fix: 'Block wasted ad searches and point every post and ad at a clear next step.',
    href: '/paid-search',
    service: 'Paid search',
  },
];

const R = 52;
const CIRC = 2 * Math.PI * R;

function verdict(score: number) {
  if (score === 100) return 'Excellent. Let’s keep it that way.';
  if (score >= 67) return 'Strong. A few tweaks will pay off.';
  if (score >= 34) return 'A solid start, with easy wins ahead.';
  return 'Lots of easy wins waiting.';
}

export default function MarketingCheckup() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState(false);
  const count = CHECKS.filter((c) => done[c.id]).length;
  const score = Math.round((count / CHECKS.length) * 100);
  const fixes = CHECKS.filter((c) => !done[c.id]).slice(0, 3);

  function toggle(id: string) {
    setTouched(true);
    setDone({ ...done, [id]: !done[id] });
  }

  return (
    <div class="demo checkup">
      <div class="demo-head">
        <p class="demo-title">Free 60-Second Marketing Checkup</p>
        <span class="demo-tag">Nothing is sent or saved</span>
      </div>

      <div class="checkup-score">
        <svg class="checkup-ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle class="ring-track" cx="60" cy="60" r={R} />
          <circle
            class="ring-fill"
            cx="60"
            cy="60"
            r={R}
            stroke-dasharray={CIRC}
            stroke-dashoffset={CIRC * (1 - score / 100)}
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="58" text-anchor="middle" class="ring-num">
            {score}
          </text>
          <text x="60" y="78" text-anchor="middle" class="ring-of">
            out of 100
          </text>
        </svg>
        <p class="checkup-verdict" aria-live="polite">
          <span class="visually-hidden">Your score: {score} out of 100. </span>
          {touched ? verdict(score) : 'Check everything that is already true for your business.'}
        </p>
      </div>

      <ul class="checkup-list" role="list">
        {CHECKS.map((c) => (
          <li>
            <label class={done[c.id] ? 'on' : undefined}>
              <input type="checkbox" checked={!!done[c.id]} onChange={() => toggle(c.id)} />
              <span>{c.label}</span>
            </label>
          </li>
        ))}
      </ul>

      {fixes.length > 0 ? (
        <div class="checkup-fixes">
          <p class="dash-section-title">Where I’d Start</p>
          <ol>
            {fixes.map((f) => (
              <li key={f.id}>
                {f.fix} <a href={f.href}>See {f.service.toLowerCase().replace('ai ', 'AI ')}</a>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p class="checkup-fixes">You’re ahead of most local businesses. Book a call and we’ll find the next level.</p>
      )}
    </div>
  );
}
