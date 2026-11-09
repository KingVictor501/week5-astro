/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import './demos.css';

// "Block or keep": real-looking search terms that trigger a small business's Google Ads.
// Blocking the bad ones (negative keywords) shrinks the wasted-budget meter.
// Dollar amounts are illustrative.

type SetId = 'locksmith' | 'electrician';

interface Term {
  text: string;
  cost: number;
  keep: boolean;
  why: string;
}

const SETS: Record<SetId, { label: string; terms: Term[] }> = {
  locksmith: {
    label: 'Locksmith',
    terms: [
      { text: 'locksmith near me open now', cost: 190, keep: true, why: 'Locked out and ready to pay, right now.' },
      { text: 'locksmith jobs hiring', cost: 70, keep: false, why: 'Job seekers, not customers.' },
      { text: 'how to pick a lock with a bobby pin', cost: 55, keep: false, why: 'Do-it-yourselfers rarely call.' },
      { text: 'car key replacement new port richey', cost: 160, keep: true, why: 'Local, specific, and a paying job.' },
      { text: 'locksmith salary florida', cost: 40, keep: false, why: 'Career research, not a customer.' },
      { text: 'rekey locks after moving', cost: 110, keep: true, why: 'A new homeowner who needs the job done.' },
    ],
  },
  electrician: {
    label: 'Electrician',
    terms: [
      { text: 'electrician near me', cost: 230, keep: true, why: 'Ready to hire.' },
      { text: 'free electrical wiring diagram', cost: 90, keep: false, why: 'Looking for free info, not a pro.' },
      { text: 'electrician apprenticeship tampa', cost: 75, keep: false, why: 'Job seekers, not customers.' },
      { text: 'ceiling fan installation clearwater', cost: 150, keep: true, why: 'Local and a clear, bookable job.' },
      { text: 'how to replace an outlet yourself', cost: 85, keep: false, why: 'Planning to do it themselves.' },
      { text: 'generator hookup before hurricane season', cost: 140, keep: true, why: 'Seasonal demand on the Gulf Coast.' },
    ],
  },
};

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

export default function SearchTermSorter() {
  const [set, setSet] = useState<SetId>('locksmith');
  const [picks, setPicks] = useState<Record<string, 'keep' | 'block'>>({});
  const terms = SETS[set].terms;

  const wasteTotal = terms.filter((t) => !t.keep).reduce((sum, t) => sum + t.cost, 0);
  const wasteLeft = terms.filter((t) => !t.keep && picks[t.text] !== 'block').reduce((sum, t) => sum + t.cost, 0);
  const correct = terms.filter((t) => picks[t.text] === (t.keep ? 'keep' : 'block')).length;
  const allDone = terms.every((t) => picks[t.text]);

  function choose(id: SetId) {
    setSet(id);
    setPicks({});
  }

  return (
    <div class="demo">
      <div class="demo-head">
        <p class="demo-title">Block or keep? Sort these ad searches</p>
        <span class="demo-tag">Illustrative example</span>
      </div>
      <p class="demo-note">
        Each search below triggered your ad and cost money. Keep the ones that bring customers and block the rest.
      </p>

      <div class="demo-seg" role="group" aria-label="Choose a business">
        {(Object.keys(SETS) as SetId[]).map((id) => (
          <button type="button" aria-pressed={id === set} onClick={() => choose(id)}>
            {SETS[id].label}
          </button>
        ))}
      </div>

      <ul class="terms">
        {terms.map((t) => {
          const pick = picks[t.text];
          const right = pick && pick === (t.keep ? 'keep' : 'block');
          return (
            <li class="term" key={`${set}-${t.text}`}>
              <span class="term-text">"{t.text}"</span>
              <div class="term-actions" role="group" aria-label={`Search: ${t.text}`}>
                <button type="button" aria-pressed={pick === 'keep'} onClick={() => setPicks({ ...picks, [t.text]: 'keep' })}>
                  Keep
                </button>
                <button type="button" aria-pressed={pick === 'block'} onClick={() => setPicks({ ...picks, [t.text]: 'block' })}>
                  Block
                </button>
              </div>
              <span class="term-cost">{money(t.cost)} last month</span>
              {pick && (
                <p class={`term-feedback ${right ? 'good' : 'bad'}`} role="status">
                  {right ? 'Right call. ' : t.keep ? 'Careful: this one brings in customers. ' : 'This one is wasting money. '}
                  {t.why}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div class="meter">
        <div class="meter-row">
          <span>Budget going to the wrong searches</span>
          <span>{money(wasteLeft)} / mo</span>
        </div>
        <div class="meter-track" aria-hidden="true">
          <div class="meter-fill" style={{ width: `${(wasteLeft / wasteTotal) * 100}%` }} />
        </div>
        <p class="demo-note" aria-live="polite">
          {allDone
            ? `${correct} of ${terms.length} right. ${wasteLeft === 0 ? `You just saved ${money(wasteTotal)} a month.` : 'Some wasted spend is still getting through.'}`
            : 'Blocking the wrong searches is one of the first things I fix in a Google Ads account.'}
        </p>
      </div>
    </div>
  );
}
