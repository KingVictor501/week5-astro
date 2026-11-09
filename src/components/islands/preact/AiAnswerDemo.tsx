/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import './demos.css';

// What an AI assistant might say before and after GEO/AEO work. Generic names only
// ("Competitor A", "your business"): no real companies, no invented reviews.
// The answer types out on switch (instant for reduced motion); the full text is always in the
// DOM for screen readers, and the typed copy is hidden from them.

interface Answer {
  intro: string;
  picks: { name: string; why: string; you?: boolean }[];
  cites: string[];
}
interface Question {
  id: string;
  label: string;
  ask: string;
  before: Answer;
  after: Answer;
  changed: string[];
}

const QUESTIONS: Question[] = [
  {
    id: 'locksmith',
    label: 'Locksmith',
    ask: 'I locked my keys in my car in Hudson. Who can help tonight?',
    before: {
      intro: 'Here are a few options for car lockout help near Hudson:',
      picks: [
        { name: 'Competitor A', why: 'lists 24/7 car lockout service on its website' },
        { name: 'A national roadside service', why: 'offers lockout help to members' },
        { name: 'Competitor B', why: 'has recent reviews mentioning fast arrival times' },
      ],
      cites: ['competitor-a.com', 'a roadside service', 'a review site'],
    },
    after: {
      intro: 'Here are a few options for car lockout help near Hudson:',
      picks: [
        { name: 'Your business', why: 'answers this exact question on its website: after-hours car lockouts across west Pasco', you: true },
        { name: 'Competitor A', why: 'lists 24/7 car lockout service on its website' },
        { name: 'A national roadside service', why: 'offers lockout help to members' },
      ],
      cites: ['yourbusiness.com/car-lockout', 'Google Business Profile', 'competitor-a.com'],
    },
    changed: [
      'Added a "Car lockouts" page that answers the question in its first sentence',
      'Listed every town you serve, matching your Google Business Profile',
      'Added structured data for your services, hours, and service area',
    ],
  },
  {
    id: 'electrician',
    label: 'Electrician',
    ask: 'Who can install a generator hookup in Palm Harbor before hurricane season?',
    before: {
      intro: 'Several electricians near Palm Harbor install generator hookups, including:',
      picks: [
        { name: 'Competitor A', why: 'publishes a clear guide to generator transfer switches' },
        { name: 'Competitor B', why: 'is frequently mentioned in local directories' },
        { name: 'Competitor C', why: 'lists free estimates on its website' },
      ],
      cites: ['competitor-a.com', 'a local directory', 'competitor-c.com'],
    },
    after: {
      intro: 'Several electricians near Palm Harbor install generator hookups, including:',
      picks: [
        { name: 'Your business', why: 'explains generator hookups for Pinellas homes, with permits and timelines, and offers estimates', you: true },
        { name: 'Competitor A', why: 'publishes a clear guide to generator transfer switches' },
        { name: 'Competitor B', why: 'is frequently mentioned in local directories' },
      ],
      cites: ['yourbusiness.com/generator-hookup', 'yourbusiness.com/service-area', 'a local directory'],
    },
    changed: [
      'Wrote plain-English answers to the questions customers ask before calling',
      'Added a page for each main service with matching structured data',
      'Made the business name, address, and phone identical across every listing',
    ],
  },
  {
    id: 'coffee',
    label: 'Coffee shop',
    ask: 'Where can I get good coffee and breakfast in Dunedin?',
    before: {
      intro: 'Popular spots for coffee and breakfast in Dunedin include:',
      picks: [
        { name: 'Competitor A', why: 'known for its pastries, with its menu posted online' },
        { name: 'Competitor B', why: 'often recommended for outdoor seating' },
        { name: 'A national chain', why: 'open early every day' },
      ],
      cites: ['competitor-a.com/menu', 'a travel site', 'national-chain.com'],
    },
    after: {
      intro: 'Popular spots for coffee and breakfast in Dunedin include:',
      picks: [
        { name: 'Your shop', why: 'posts its full breakfast menu and hours online, and is a short walk from the Pinellas Trail', you: true },
        { name: 'Competitor A', why: 'known for its pastries, with its menu posted online' },
        { name: 'Competitor B', why: 'often recommended for outdoor seating' },
      ],
      cites: ['yourshop.com/menu', 'Google Business Profile', 'competitor-a.com/menu'],
    },
    changed: [
      'Put the menu on the website as text, not just a photo of the board',
      'Filled out the Google Business Profile: hours, photos, and what you are known for',
      'Added a short "About" with your neighborhood and what makes you different',
    ],
  },
];

const answerText = (a: Answer) =>
  [a.intro, ...a.picks.map((p, i) => `${i + 1}. ${p.name}: ${p.why}.`)].join(' ');

export default function AiAnswerDemo() {
  const [qid, setQid] = useState(QUESTIONS[0].id);
  const [after, setAfter] = useState(true);
  const [typed, setTyped] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const q = QUESTIONS.find((x) => x.id === qid)!;
  const answer = after ? q.after : q.before;
  const full = answerText(answer);

  useEffect(() => () => window.clearInterval(timer.current), []);

  function animate() {
    window.clearInterval(timer.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(null);
      return;
    }
    let n = 0;
    setTyped(0);
    timer.current = window.setInterval(() => {
      n += 4;
      if (n >= full.length + 40) {
        window.clearInterval(timer.current);
        setTyped(null);
      } else setTyped(n);
    }, 16);
  }

  // Re-type the answer whenever the question or the before/after view changes (not on first render).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    animate();
  }, [qid, after]);

  // Characters revealed so far, spread across the intro and each pick.
  let budget = typed ?? Infinity;
  const take = (s: string) => {
    const out = s.slice(0, Math.max(0, budget));
    budget -= s.length;
    return out;
  };

  return (
    <div class="demo">
      <div class="demo-head">
        <p class="demo-title">What AI tells your customers</p>
        <span class="demo-tag">Illustrative example</span>
      </div>

      <div class="demo-seg" role="group" aria-label="Choose a question">
        {QUESTIONS.map((x) => (
          <button type="button" aria-pressed={x.id === qid} onClick={() => setQid(x.id)}>
            {x.label}
          </button>
        ))}
      </div>

      <p class="ai-question">
        <span class="visually-hidden">Customer asks: </span>
        {q.ask}
      </p>

      <div class="ai-answer">
        <span class="ai-label">AI assistant {after ? '(after GEO and AEO)' : '(before)'}</span>
        <p class="visually-hidden" aria-live="polite">
          {typed === null ? full : ''}
        </p>
        <div aria-hidden="true" class={typed !== null ? 'ai-cursor' : undefined}>
          <p>{take(answer.intro)}</p>
          <ol>
            {answer.picks.map((p) => {
              const name = take(p.name);
              const why = take(`: ${p.why}.`);
              if (!name) return null;
              return (
                <li>
                  <span class={p.you ? 'ai-you' : undefined}>{name}</span>
                  {why}
                </li>
              );
            })}
          </ol>
          {typed === null && (
            <div class="ai-cites">
              {answer.cites.map((c) => (
                <span>{c}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div class="demo-seg" role="group" aria-label="Before or after optimization">
        <button type="button" aria-pressed={!after} onClick={() => setAfter(false)}>
          Before
        </button>
        <button type="button" aria-pressed={after} onClick={() => setAfter(true)}>
          After GEO and AEO
        </button>
      </div>

      <div>
        <p class="dash-section-title">What changed on the website</p>
        <ul class="ai-why">
          {q.changed.map((c) => (
            <li>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
