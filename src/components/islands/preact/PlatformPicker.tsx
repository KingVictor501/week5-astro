/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import './demos.css';
import { titleCase } from '../../../lib/titleCase';

// Four plain-English questions, one at a time in a square card, that point to Squarespace, Wix,
// Shopify, WordPress, or a custom build. Picking an answer slides to the next question (no slide
// for reduced motion) and moves focus to it. Answers are buttons, not radios, because
// auto-advancing on a radio change would fire on every arrow key.

type Platform = 'squarespace' | 'wix' | 'shopify' | 'wordpress' | 'custom';

interface Question {
  id: string;
  legend: string;
  options: { label: string; points: Partial<Record<Platform, number>> }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'need',
    legend: 'What does your website mainly need to do?',
    options: [
      { label: 'Show my info and get calls', points: { squarespace: 2, wix: 2, custom: 1 } },
      { label: 'Sell products online', points: { shopify: 3, wordpress: 1 } },
      { label: 'Take bookings or do something custom', points: { custom: 3, wordpress: 1 } },
      { label: 'Publish lots of articles', points: { wordpress: 3, custom: 1 } },
    ],
  },
  {
    id: 'edit',
    legend: 'Who will make changes to it?',
    options: [
      { label: 'Me, with drag and drop', points: { wix: 2, squarespace: 2, shopify: 1 } },
      { label: 'Me, but only text and photos', points: { wordpress: 1, custom: 1, squarespace: 1 } },
      { label: 'Someone else handles it', points: { custom: 2, wordpress: 1 } },
    ],
  },
  {
    id: 'cost',
    legend: 'What matters more for cost?',
    options: [
      { label: 'Lowest upfront cost', points: { wix: 2, squarespace: 2 } },
      { label: 'Low monthly fees over time', points: { custom: 2, wordpress: 1 } },
      { label: 'Paying for what helps me grow', points: { custom: 1, shopify: 1, wordpress: 1 } },
    ],
  },
  {
    id: 'must',
    legend: 'What is your must-have?',
    options: [
      { label: 'Fast and accessible to everyone', points: { custom: 3 } },
      { label: 'A beautiful template, quickly', points: { squarespace: 3, wix: 1 } },
      { label: 'Connects to my other tools', points: { custom: 2, wordpress: 1, shopify: 1 } },
    ],
  },
];

const RESULTS: Record<Platform, { name: string; why: string }> = {
  squarespace: {
    name: 'Squarespace',
    why: 'Great-looking templates and simple editing for a site that mainly shares your info. I can set it up, tune it for search, and connect your booking and email tools.',
  },
  wix: {
    name: 'Wix',
    why: 'Easy drag-and-drop editing and a low start-up cost. I can make it faster, fix mobile layouts, and set up lead capture so it actually brings in calls.',
  },
  shopify: {
    name: 'Shopify',
    why: 'The simplest dependable way to sell products online. I can customize your theme, speed up product pages, and connect email and analytics.',
  },
  wordpress: {
    name: 'WordPress',
    why: 'Flexible and strong for content-heavy sites. I can keep it fast and secure, trim the plugins, and add structured data so search engines and AI can read it.',
  },
  custom: {
    name: 'A custom-built site',
    why: 'The fastest, most flexible option with low ongoing fees and no platform limits. I build it from the ground up, accessible to WCAG 2.2 AA, with the features your business needs.',
  },
};

export default function PlatformPicker() {
  const [answers, setAnswers] = useState<number[]>([]);
  const step = answers.length; // 0..QUESTIONS.length (last = result)
  const done = step === QUESTIONS.length;
  const headings = useRef<(HTMLElement | null)[]>([]);
  const moved = useRef(false);

  // After moving to another panel, put focus on its heading so keyboard and screen-reader
  // users land on the new question (not on first render).
  useEffect(() => {
    if (!moved.current) return;
    headings.current[step]?.focus({ preventScroll: true });
  }, [step]);

  function answer(i: number) {
    moved.current = true;
    setAnswers([...answers, i]);
  }

  function back() {
    moved.current = true;
    setAnswers(answers.slice(0, -1));
  }

  function restart() {
    moved.current = true;
    setAnswers([]);
  }

  let result: Platform | null = null;
  if (done) {
    const score: Record<Platform, number> = { squarespace: 0, wix: 0, shopify: 0, wordpress: 0, custom: 0 };
    QUESTIONS.forEach((q, qi) => {
      for (const [p, n] of Object.entries(q.options[answers[qi]].points)) score[p as Platform] += n ?? 0;
    });
    result = (Object.keys(score) as Platform[]).reduce((a, b) => (score[b] > score[a] ? b : a));
  }

  const panels = QUESTIONS.length + 1;

  return (
    <div class="demo pick">
      <div class="demo-head">
        <p class="demo-title">Which Website Platform Fits You?</p>
        <span class="demo-tag">{done ? 'Your result' : `Question ${step + 1} of ${QUESTIONS.length}`}</span>
      </div>
      <div class="pick-progress" aria-hidden="true">
        <span style={{ width: `${(step / QUESTIONS.length) * 100}%` }} />
      </div>

      <div class="pick-window">
        <div class="pick-track" style={{ transform: `translateX(-${(step * 100) / panels}%)`, width: `${panels * 100}%` }}>
          {QUESTIONS.map((q, qi) => (
            <section class="pick-panel" style={{ width: `${100 / panels}%` }} inert={qi !== step} aria-hidden={qi !== step}>
              <h3 class="pick-q" tabIndex={-1} ref={(el) => { headings.current[qi] = el; }}>
                {titleCase(q.legend)}
              </h3>
              <ul class="pick-choices" role="list">
                {q.options.map((o, i) => (
                  <li>
                    <button type="button" class={answers[qi] === i ? 'chosen' : undefined} onClick={() => answer(i)}>
                      {o.label}
                    </button>
                  </li>
                ))}
              </ul>
              {qi > 0 && (
                <button type="button" class="pick-back" onClick={back}>
                  ← Back
                </button>
              )}
            </section>
          ))}

          <section class="pick-panel pick-final" style={{ width: `${100 / panels}%` }} inert={!done} aria-hidden={!done}>
            <h3 class="pick-q" tabIndex={-1} ref={(el) => { headings.current[QUESTIONS.length] = el; }}>
              {titleCase(`My suggestion: ${result ? RESULTS[result].name : ''}`)}
            </h3>
            <p>{result ? RESULTS[result].why : ''}</p>
            <p class="demo-note">Whatever you pick, I can build it, fix it, or move you to something better.</p>
            <div class="pick-final-actions">
              <button type="button" class="pick-back" onClick={back}>
                ← Back
              </button>
              <button type="button" class="demo-btn" onClick={restart}>
                Start over
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
