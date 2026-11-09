/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import './demos.css';

// "Watch an AI helper work": three local-business scenarios, step by step. Everything is
// rendered on the server first (all steps visible), so it reads fine without JavaScript.
// Play reveals the steps one at a time; reduced-motion visitors get them all at once.

type Kind = 'trigger' | 'ai' | 'customer' | 'done';
interface Step {
  kind: Kind;
  who: string;
  text: string;
}
interface Scenario {
  id: string;
  label: string;
  steps: Step[];
  without: string;
  withIt: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'plumber',
    label: 'Plumber',
    steps: [
      { kind: 'trigger', who: 'Missed call', text: 'A new customer calls at 7:12 PM while you are under a sink.' },
      { kind: 'ai', who: 'AI helper', text: 'Texts back within seconds: "Sorry we missed you! What is going on?"' },
      { kind: 'customer', who: 'Customer', text: '"Water heater is leaking in the garage."' },
      { kind: 'ai', who: 'AI helper', text: 'Asks for the address, checks your calendar, and offers tomorrow from 8 to 10 AM.' },
      { kind: 'customer', who: 'Customer', text: '"Book it!"' },
      { kind: 'done', who: 'Booked', text: 'The job lands on your calendar, the customer gets a confirmation and a reminder, and you get a one-line summary.' },
    ],
    without: 'A voicemail you return tomorrow, after they may have called someone else.',
    withIt: 'Booked before you are back from dinner.',
  },
  {
    id: 'bakery',
    label: 'Bakery',
    steps: [
      { kind: 'trigger', who: 'Web form', text: 'A catering request comes in through your website at 11 PM.' },
      { kind: 'ai', who: 'AI helper', text: 'Replies with your catering menu, order minimums, and open pickup days.' },
      { kind: 'customer', who: 'Customer', text: '"Three dozen cupcakes for Saturday, half vanilla, half chocolate."' },
      { kind: 'ai', who: 'AI helper', text: 'Totals the order and sends a secure deposit link.' },
      { kind: 'customer', who: 'Customer', text: 'Pays the deposit from their phone.' },
      { kind: 'done', who: 'Ordered', text: 'The order appears on Friday\'s prep list, already paid, waiting for you in the morning.' },
    ],
    without: 'An email thread that takes three days and a phone call to settle.',
    withIt: 'A paid order on your prep list by morning.',
  },
  {
    id: 'law',
    label: 'Law firm',
    steps: [
      { kind: 'trigger', who: 'Web form', text: 'A potential client fills out your website form on a Sunday.' },
      { kind: 'ai', who: 'AI helper', text: 'Sends your intake questions: type of matter, county, and the other party\'s name.' },
      { kind: 'customer', who: 'Client', text: 'Answers the questions from their phone.' },
      { kind: 'ai', who: 'AI helper', text: 'Flags the other party\'s name for your conflict check and offers consultation times. It never gives legal advice.' },
      { kind: 'customer', who: 'Client', text: 'Picks Tuesday at 2 PM.' },
      { kind: 'done', who: 'Booked', text: 'The consultation is booked and an intake summary is ready for the attorney to review Monday.' },
    ],
    without: 'A form sitting in an inbox until Monday, while they call the next firm.',
    withIt: 'A booked consultation and a clean intake file before the week starts.',
  },
];

const STEP_MS = 1100;

export default function AutomationDemo() {
  const [active, setActive] = useState(SCENARIOS[0].id);
  const [shown, setShown] = useState(SCENARIOS[0].steps.length);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const scenario = SCENARIOS.find((s) => s.id === active)!;

  useEffect(() => () => window.clearInterval(timer.current), []);

  function stop() {
    window.clearInterval(timer.current);
    setPlaying(false);
  }

  function choose(id: string) {
    stop();
    setActive(id);
    setShown(SCENARIOS.find((s) => s.id === id)!.steps.length);
  }

  function play() {
    stop();
    const total = scenario.steps.length;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(total);
      return;
    }
    setShown(1);
    setPlaying(true);
    let count = 1;
    timer.current = window.setInterval(() => {
      count += 1;
      setShown(count);
      if (count >= total) stop();
    }, STEP_MS);
  }

  return (
    <div class="demo">
      <div class="demo-head">
        <p class="demo-title">Watch an AI helper work</p>
        <span class="demo-tag">Illustrative example</span>
      </div>

      <div class="demo-seg" role="group" aria-label="Choose a business">
        {SCENARIOS.map((s) => (
          <button type="button" aria-pressed={s.id === active} onClick={() => choose(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <ol class="flow" aria-live={playing ? 'polite' : 'off'}>
        {scenario.steps.slice(0, shown).map((step, i) => (
          <li key={`${active}-${i}`} class={`flow-${step.kind} demo-reveal`}>
            <span class="flow-who">{step.who}</span>
            <p class="flow-text">{step.text}</p>
          </li>
        ))}
      </ol>

      <button type="button" class="demo-btn" onClick={playing ? stop : play}>
        {playing ? 'Stop' : 'Play it step by step'}
      </button>

      <dl class="flow-compare">
        <div>
          <dt>Without it</dt>
          <dd>{scenario.without}</dd>
        </div>
        <div>
          <dt>With it</dt>
          <dd>{scenario.withIt}</dd>
        </div>
      </dl>
    </div>
  );
}
