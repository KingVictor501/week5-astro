import { useCallback, useEffect, useRef, useState } from 'react';
import './ListenPlayer.css';

// "Listen to this post": reads the article body aloud with the browser's built-in
// Web Speech API (speechSynthesis). No paid API, no audio files.
// One utterance per paragraph, so we can highlight the current paragraph and resume reliably.
// Pause/resume, speed, and voice changes restart the current paragraph, because
// speechSynthesis.pause()/resume() and mid-utterance rate changes are unreliable across browsers.

const BLOCKS = 'p, h2, h3, h4, li, blockquote';
// Skip code blocks, figures and captions, and anything marked data-no-listen. Inline code is read.
const SKIP = 'pre, figure, figcaption, [data-no-listen]';
const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const WORDS_PER_MINUTE_AT_1X = 150;
const PREFS_KEY = 'listen-prefs';

interface Chunk {
  text: string;
  /** Element to highlight while this chunk is read (null for the title). */
  el: HTMLElement | null;
}

type Status = 'idle' | 'playing' | 'paused';

function collectChunks(): Chunk[] {
  const chunks: Chunk[] = [];
  const title = document.getElementById('post-title')?.textContent?.trim();
  if (title) chunks.push({ text: title, el: null });
  const body = document.querySelector<HTMLElement>('.prose');
  if (!body) return chunks;
  body.querySelectorAll<HTMLElement>(BLOCKS).forEach((el) => {
    if (el.closest(SKIP)) return;
    if (el.querySelector(BLOCKS)) return; // read the innermost block only (e.g. a <p> inside an <li>)
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(SKIP).forEach((n) => n.remove());
    const text = clone.textContent?.replace(/\s+/g, ' ').trim();
    if (text) chunks.push({ text, el });
  });
  return chunks;
}

function loadPrefs(): { rate?: number; voice?: string; follow?: boolean } {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function savePrefs(prefs: { rate: number; voice: string; follow: boolean }) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Storage blocked: preferences last for this page only.
  }
}

interface Props {
  /** Article word count from the server, so the "· N min" estimate renders before hydration (no layout shift). */
  words: number;
}

export default function ListenPlayer({ words }: Props) {
  // Assume support for the server render; the real check runs after hydration.
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [follow, setFollow] = useState(true);
  const [progress, setProgress] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsButton = useRef<HTMLButtonElement>(null);
  const optionsPanel = useRef<HTMLDivElement>(null);

  const chunks = useRef<Chunk[]>([]);
  const index = useRef(0);
  const offsets = useRef<number[]>([]);
  // Bumped on every (re)start or stop, so callbacks from cancelled utterances are ignored.
  const session = useRef(0);
  const settings = useRef({ rate, voiceURI, follow });
  settings.current = { rate, voiceURI, follow };

  const clearHighlight = () => document.querySelectorAll('[data-listen-current]').forEach((n) => n.removeAttribute('data-listen-current'));

  const highlight = (chunk: Chunk | undefined) => {
    clearHighlight();
    if (!chunk?.el || !settings.current.follow) return;
    chunk.el.setAttribute('data-listen-current', '');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    chunk.el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  };

  const speakFrom = useCallback((start: number) => {
    const synth = window.speechSynthesis;
    const id = ++session.current;
    synth.cancel();
    index.current = start;

    const speakNext = () => {
      if (id !== session.current) return;
      const i = index.current;
      const chunk = chunks.current[i];
      if (!chunk) {
        session.current++;
        clearHighlight();
        setStatus('idle');
        setProgress(0);
        index.current = 0;
        setAnnouncement('Finished reading.');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utterance.lang = 'en-US';
      utterance.rate = settings.current.rate;
      const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === settings.current.voiceURI);
      if (voice) utterance.voice = voice;
      utterance.onstart = () => {
        if (id !== session.current) return;
        setProgress(offsets.current[i]);
        highlight(chunk);
      };
      utterance.onboundary = (event) => {
        if (id === session.current) setProgress(offsets.current[i] + event.charIndex);
      };
      utterance.onend = () => {
        if (id !== session.current) return;
        index.current = i + 1;
        setProgress(offsets.current[i] + chunk.text.length);
        speakNext();
      };
      utterance.onerror = (event) => {
        // "interrupted"/"canceled" come from our own cancel() calls.
        if (id !== session.current || event.error === 'interrupted' || event.error === 'canceled') return;
        index.current = i + 1;
        speakNext();
      };
      synth.speak(utterance);
    };

    setStatus('playing');
    speakNext();
  }, []);

  const stop = useCallback((announce = true) => {
    session.current++;
    window.speechSynthesis?.cancel();
    clearHighlight();
    index.current = 0;
    setProgress(0);
    setStatus('idle');
    if (announce) setAnnouncement('Stopped.');
  }, []);

  // Feature detection, text extraction, voices, saved preferences.
  useEffect(() => {
    if (typeof window.speechSynthesis?.speak !== 'function' || typeof window.SpeechSynthesisUtterance !== 'function') {
      setSupported(false);
      return;
    }
    chunks.current = collectChunks();
    let running = 0;
    offsets.current = chunks.current.map((c) => {
      const start = running;
      running += c.text.length;
      return start;
    });
    setTotalChars(running);

    const prefs = loadPrefs();
    if (prefs.rate && SPEEDS.includes(prefs.rate)) setRate(prefs.rate);
    if (typeof prefs.follow === 'boolean') setFollow(prefs.follow);

    const loadVoices = () => {
      const english = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
      setVoices(english);
      setVoiceURI((current) => {
        if (current && english.some((v) => v.voiceURI === current)) return current;
        if (prefs.voice && english.some((v) => v.voiceURI === prefs.voice)) return prefs.voice;
        return (english.find((v) => v.default) ?? english.find((v) => v.lang === 'en-US') ?? english[0])?.voiceURI ?? '';
      });
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    // Stop speaking when leaving the page (View Transitions, back/forward, closing the tab).
    const leave = () => stop(false);
    document.addEventListener('astro:before-preparation', leave);
    window.addEventListener('pagehide', leave);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      document.removeEventListener('astro:before-preparation', leave);
      window.removeEventListener('pagehide', leave);
      stop(false);
    };
  }, [stop]);

  useEffect(() => {
    if (supported) savePrefs({ rate, voice: voiceURI, follow });
  }, [rate, voiceURI, follow, supported]);

  // Speed or voice changes apply from the current paragraph. Update the ref first so the
  // restarted utterance uses the new value before React re-renders.
  const changeSetting = (patch: Partial<typeof settings.current>) => {
    settings.current = { ...settings.current, ...patch };
    if (status === 'playing') speakFrom(index.current);
  };

  const togglePlay = () => {
    if (status === 'playing') {
      session.current++;
      window.speechSynthesis.cancel();
      setStatus('paused');
      setAnnouncement('Paused.');
    } else {
      setAnnouncement(status === 'paused' ? 'Resumed.' : 'Playing.');
      speakFrom(status === 'paused' ? index.current : 0);
    }
  };

  useEffect(() => {
    if (!follow) clearHighlight();
  }, [follow]);

  // Options pop-out: close on outside click or Escape (focus returns to its button).
  useEffect(() => {
    if (!optionsOpen) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!optionsPanel.current?.contains(target) && !optionsButton.current?.contains(target)) setOptionsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOptionsOpen(false);
      optionsButton.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [optionsOpen]);

  if (!supported) return null;

  const percent = totalChars ? Math.min(100, Math.round((progress / totalChars) * 100)) : 0;
  const minutesLeft = Math.max(1, Math.ceil(((words * (1 - percent / 100)) / WORDS_PER_MINUTE_AT_1X) / rate));
  const active = status !== 'idle';
  const playLabel = status === 'playing' ? 'Pause' : status === 'paused' ? 'Resume' : 'Listen to this post';

  return (
    <div className="listen-slot">
      <section className={`listen${active ? ' listen-active' : ''}`} aria-label="Listen to this post">
        <button type="button" className="listen-play" onClick={togglePlay} aria-label={playLabel}>
          <span className="listen-icon" aria-hidden="true">
            {status === 'playing' ? (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            )}
          </span>
          <span className="listen-play-text" aria-hidden="true">
            {active ? playLabel : 'Listen'}
          </span>
          {!active && words > 0 && (
            <span className="listen-duration" aria-hidden="true">
              · {minutesLeft} min
            </span>
          )}
        </button>

        {active && (
          <>
            <button type="button" className="listen-btn" onClick={() => stop()} aria-label="Stop">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" />
              </svg>
            </button>

            <div className="listen-progress">
              <progress max={100} value={percent} aria-label="Listening progress" />
              <span className="listen-time">{percent}% · about {minutesLeft} min left</span>
            </div>
          </>
        )}

        <div className="listen-options">
          <label className="listen-field">
            <span className="visually-hidden">Reading speed</span>
            <select
              value={rate}
              onChange={(e) => {
                const value = Number(e.target.value);
                setRate(value);
                changeSetting({ rate: value });
              }}
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
          </label>

          {/* Voice + follow-along live in a pop-out, so the pill is the same size before and
              after the browser reports its voices (no layout shift on hydration). */}
          <button
            type="button"
            ref={optionsButton}
            className="listen-btn"
            aria-expanded={optionsOpen}
            aria-controls="listen-options-panel"
            aria-label="Listening options"
            onClick={() => setOptionsOpen((o) => !o)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M4 7h10M18 7h2M4 17h4M12 17h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="16" cy="7" r="2.25" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="10" cy="17" r="2.25" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>

          <div
            id="listen-options-panel"
            ref={optionsPanel}
            className="listen-panel"
            role="group"
            aria-label="Listening options"
            hidden={!optionsOpen}
          >
            {voices.length > 1 && (
              <label className="listen-field listen-field-stacked">
                Voice
                <select
                  className="listen-voice"
                  value={voiceURI}
                  onChange={(e) => {
                    setVoiceURI(e.target.value);
                    changeSetting({ voiceURI: e.target.value });
                  }}
                >
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="listen-follow">
              <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
              Highlight and follow along
            </label>
          </div>
        </div>
      </section>

      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
