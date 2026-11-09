// Title case for every heading and title on the site (AP-style):
// - Capitalize every word except short articles, conjunctions, and prepositions (a, and, of, to...).
// - Always capitalize the first and last word, and the word after a colon, dash, or sentence end.
// - Leave words that already carry their own capitals alone (AI, GEO, ChatGPT, GA4, WCAG, iPhone),
//   and leave web addresses (yourbusiness.com) alone.
// - Capitalize each part of a hyphenated word (Full-Stack, After-Hours, Tap-to-Call).
// Idempotent, so it's safe to apply to text that is already title case.

const MINOR = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  'as', 'at', 'by', 'in', 'of', 'on', 'per', 'to', 'via', 'vs', 'vs.',
]);

const hasOwnCaps = (word: string) => /[A-Z]/.test(word.slice(1)) || (/^[A-Z0-9]+$/.test(word) && /[A-Z]/.test(word));
const isAddress = (word: string) => /\w\.\w/.test(word) || word.includes('/') || word.includes('@');

function capitalize(part: string): string {
  // Skip leading punctuation such as quotes or parentheses: "free -> "Free
  const i = part.search(/[A-Za-z]/);
  if (i < 0) return part;
  return part.slice(0, i) + part.charAt(i).toUpperCase() + part.slice(i + 1);
}

function caseWord(word: string, forceCap: boolean): string {
  if (!/[A-Za-z]/.test(word) || hasOwnCaps(word) || isAddress(word)) return word;
  const parts = word.split('-');
  return parts
    .map((part, i) => {
      const bare = part.replace(/^[^A-Za-z]+|[^A-Za-z.]+$/g, '').toLowerCase();
      if (hasOwnCaps(part)) return part;
      if (i === 0 && forceCap) return capitalize(part);
      if (MINOR.has(bare)) {
        // Lowercase a minor word on its own or in the middle of a compound (Tap-to-Call);
        // capitalize it at either end of a compound (In-House, Check-In).
        const end = parts.length > 1 && (i === 0 || i === parts.length - 1);
        return end ? capitalize(part) : part.toLowerCase();
      }
      return capitalize(part);
    })
    .join('-');
}

export interface TitleCaseOptions {
  /** Capitalize the first word (default true). Set false for a later piece of a split heading. */
  first?: boolean;
  /** Capitalize the last word (default true). */
  last?: boolean;
}

export function titleCase(text: string, { first = true, last = true }: TitleCaseOptions = {}): string {
  const tokens = text.split(/(\s+)/);
  const wordIdx = tokens.map((t, i) => (/\S/.test(t) ? i : -1)).filter((i) => i >= 0);
  const firstWord = wordIdx[0];
  const lastWord = wordIdx[wordIdx.length - 1];
  let capNext = first;
  return tokens
    .map((token, i) => {
      if (!/\S/.test(token)) return token;
      const force = capNext || (last && i === lastWord) || (first && i === firstWord);
      capNext = /[:—–!?.]$/.test(token) && !isAddress(token);
      if (token === '–' || token === '—' || token === '-') {
        capNext = true;
        return token;
      }
      return caseWord(token, force);
    })
    .join('');
}
