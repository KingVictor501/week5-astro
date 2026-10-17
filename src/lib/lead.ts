// Lead forms (Book a Call and the /lp/ lead magnet pages): shared validation + submission.
// The same validate function runs in the browser and in the demo "server", and Formspree
// performs its own server-side checks once PUBLIC_FORMSPREE_ENDPOINT is set.
// Never log form values: they are personal data.

export type ContactMethod = 'email' | 'phone';

export interface LeadValues {
  name: string;
  email: string;
  company: string;
  website: string;
  service: string;
  budget: string;
  message: string;
  contactMethod: ContactMethod;
  phone: string;
  /** Honeypot. Real people never see or fill this. */
  _gotcha: string;
}

export type LeadField = Exclude<keyof LeadValues, '_gotcha'>;
export type LeadErrors = Partial<Record<LeadField, string>>;

/** Order used to find the first invalid field (matches the visual order of the form). */
export const FIELD_ORDER: LeadField[] = ['name', 'email', 'company', 'website', 'service', 'budget', 'contactMethod', 'phone', 'message'];

export const BUDGET_OPTIONS = [
  'Under $1,000 / month',
  '$1,000 – $2,500 / month',
  '$2,500 – $5,000 / month',
  '$5,000 – $10,000 / month',
  '$10,000+ / month',
  'Not sure yet',
];

export const NOT_SURE_SERVICE = 'not-sure';

export const EMPTY_LEAD: LeadValues = {
  name: '',
  email: '',
  company: '',
  website: '',
  service: '',
  budget: '',
  message: '',
  contactMethod: 'email',
  phone: '',
  _gotcha: '',
};

// Local part: letters, digits and . _ % + - (no leading, trailing or double dots).
// Domain: one or more labels, then one of the accepted endings below.
const EMAIL_RE = /^[A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
/** The only email endings the forms accept. Add to this list to allow more. */
export const EMAIL_ENDINGS = ['com', 'gov', 'edu', 'org', 'mil', 'net', 'us', 'co', 'io'];
const EMAIL_ENDINGS_TEXT = new Intl.ListFormat('en', { type: 'disjunction' }).format(EMAIL_ENDINGS.map((e) => `.${e}`));
const HOST_RE = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
// Names: letters (any language), spaces, and . ' ’ - only.
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;
// Company names can also have digits and & , ( ) ! +
const COMPANY_RE = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .,'’&()!+-]*$/u;
const PHONE_RE = /^\+?[\d\s().-]+$/;
const LINK_RE = /https?:\/\/|www\./gi;
const TAG_RE = /<[^>]+>/;
export const MESSAGE_MAX = 2000;
const MESSAGE_MIN = 10;
const MESSAGE_MAX_LINKS = 2;

/** True for filler like "aaaa" or "....": one character repeated. */
const allSameChar = (text: string) => /^(.)\1*$/su.test(text.replace(/\s/g, ''));

function emailError(email: string): string | undefined {
  if (!email) return 'Enter your email address.';
  if (email.length > 254 || !EMAIL_RE.test(email)) return 'Enter an email address like name@example.com.';
  const ending = email.slice(email.lastIndexOf('.') + 1).toLowerCase();
  if (!EMAIL_ENDINGS.includes(ending)) return `Use an email address ending in ${EMAIL_ENDINGS_TEXT}.`;
  return undefined;
}

/** Shared by the name field here and the first-name field on the lead magnet form. */
function nameError(name: string, max: number, label: string): string | undefined {
  if (name.length > max) return `Keep your ${label} under ${max} characters.`;
  if (name.length < 2 || !NAME_RE.test(name) || allSameChar(name)) {
    return `Enter your ${label} using letters only (spaces, hyphens and apostrophes are fine).`;
  }
  return undefined;
}

function websiteError(website: string): string | undefined {
  if (website.length > 200 || /\s/.test(website)) return 'Enter a website address like example.com.';
  try {
    const url = new URL(website.includes('://') ? website : `https://${website}`);
    if (!/^https?:$/.test(url.protocol) || !HOST_RE.test(url.hostname) || url.username || url.password) {
      throw new Error('bad url');
    }
  } catch {
    return 'Enter a website address like example.com.';
  }
  return undefined;
}

export function validateLead(values: LeadValues, allowedServices: string[]): LeadErrors {
  const errors: LeadErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const company = values.company.trim();
  const website = values.website.trim();
  const message = values.message.trim();

  if (!name) errors.name = 'Enter your name.';
  else {
    const badName = nameError(name, 100, 'name');
    if (badName) errors.name = badName;
  }

  const badEmail = emailError(email);
  if (badEmail) errors.email = badEmail;

  if (company) {
    if (company.length > 100) errors.company = 'Keep your company name under 100 characters.';
    else if (company.length < 2 || !COMPANY_RE.test(company) || allSameChar(company) || /www\./i.test(company)) {
      errors.company = 'Enter your company name using letters and numbers.';
    }
  }

  if (website) {
    const badWebsite = websiteError(website);
    if (badWebsite) errors.website = badWebsite;
  }

  if (values.service && !allowedServices.includes(values.service)) errors.service = 'Choose a service from the list.';
  if (values.budget && !BUDGET_OPTIONS.includes(values.budget)) errors.budget = 'Choose a budget range from the list.';

  if (values.contactMethod !== 'email' && values.contactMethod !== 'phone') {
    errors.contactMethod = 'Choose how you would like me to contact you.';
  }
  if (values.contactMethod === 'phone') {
    const phone = values.phone.trim();
    const digits = phone.replace(/\D/g, '');
    if (!digits) errors.phone = 'Enter a phone number so I can call you.';
    else if (!PHONE_RE.test(phone) || digits.length < 10 || digits.length > 15 || allSameChar(digits)) {
      errors.phone = 'Enter a valid phone number, including area code.';
    }
  }

  if (message) {
    const links = message.match(LINK_RE)?.length ?? 0;
    if (message.length > MESSAGE_MAX) errors.message = `Keep your message under ${MESSAGE_MAX} characters.`;
    else if (message.length < MESSAGE_MIN || allSameChar(message) || !/\p{L}{2,}/u.test(message)) {
      errors.message = `Write at least a short sentence (${MESSAGE_MIN} or more characters), or leave this blank.`;
    } else if (TAG_RE.test(message)) errors.message = 'Remove any HTML or code from your message.';
    else if (links > MESSAGE_MAX_LINKS) errors.message = `Include no more than ${MESSAGE_MAX_LINKS} links.`;
  }
  return errors;
}

export type FailureKind = 'network' | 'server' | 'rate-limit' | 'validation';

/** Shown when a submission fails for a reason other than invalid fields. */
export const FAILURE_COPY: Record<Exclude<FailureKind, 'validation'>, { title: string; text: string }> = {
  network: {
    title: "We couldn't reach the server",
    text: 'Check your internet connection, then try again. Everything you typed is still here.',
  },
  server: {
    title: 'Something went wrong on our end',
    text: "That's not your fault. Your details are still here, so you can try again in a moment.",
  },
  'rate-limit': {
    title: 'Too many requests in a short time',
    text: 'Please wait a minute, then try again. Your details are still here.',
  },
};

export class LeadSubmitError extends Error {
  kind: FailureKind;
  /** Field name → message, for whichever form was submitted. */
  fieldErrors: Partial<Record<string, string>>;

  constructor(kind: FailureKind, fieldErrors: Partial<Record<string, string>> = {}) {
    super(kind);
    this.kind = kind;
    this.fieldErrors = fieldErrors;
  }
}

export type Simulation = 'success' | 'server-error' | 'network-error' | 'rate-limit';
export const SIMULATIONS: Simulation[] = ['success', 'server-error', 'network-error', 'rate-limit'];

interface SubmitOptions {
  /** Formspree endpoint. When missing, the form runs in demo mode and nothing leaves the browser. */
  endpoint?: string;
  allowedServices: string[];
  /** Demo mode only: force a failure to test error handling. */
  simulate?: Simulation;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface SendOptions {
  endpoint?: string;
  simulate?: Simulation;
  /** Field names the form shows, so server-side field errors can be matched to them. */
  fields: readonly string[];
  /** Demo mode stands in for the server's own validation. */
  demoValidate: () => Partial<Record<string, string>>;
}

/** POST a form to Formspree, or fake it in demo mode. Throws LeadSubmitError on failure. */
async function sendForm(payload: Record<string, unknown>, { endpoint, simulate, fields, demoValidate }: SendOptions): Promise<void> {
  if (!endpoint) {
    // Demo mode: mimic a real backend, including server-side validation.
    await wait(1200);
    if (simulate === 'network-error') throw new LeadSubmitError('network');
    if (simulate === 'server-error') throw new LeadSubmitError('server');
    if (simulate === 'rate-limit') throw new LeadSubmitError('rate-limit');
    const serverErrors = demoValidate();
    if (Object.keys(serverErrors).length > 0) throw new LeadSubmitError('validation', serverErrors);
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    // Personal data goes in the POST body only, never in the URL.
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch {
    throw new LeadSubmitError('network');
  } finally {
    clearTimeout(timeout);
  }

  if (response.ok) return;
  if (response.status === 429) throw new LeadSubmitError('rate-limit');
  if (response.status === 400 || response.status === 422) {
    // Formspree returns { errors: [{ field, message }] } for invalid fields.
    const body = (await response.json().catch(() => ({}))) as { errors?: { field?: string; message?: string }[] };
    const fieldErrors: Partial<Record<string, string>> = {};
    for (const error of body.errors ?? []) {
      if (error.field && fields.includes(error.field)) fieldErrors[error.field] = error.message ?? 'Check this field.';
    }
    throw new LeadSubmitError(Object.keys(fieldErrors).length > 0 ? 'validation' : 'server', fieldErrors);
  }
  throw new LeadSubmitError('server');
}

export async function submitLead(values: LeadValues, { endpoint, allowedServices, simulate }: SubmitOptions): Promise<void> {
  // Honeypot filled: almost certainly a bot. Pretend it worked and send nothing.
  if (values._gotcha) return;

  const payload = {
    ...values,
    name: values.name.trim(),
    email: values.email.trim(),
    website: values.website.trim(),
    phone: values.contactMethod === 'phone' ? values.phone.trim() : '',
    _subject: 'New Book a Call request',
  };
  await sendForm(payload, { endpoint, simulate, fields: FIELD_ORDER, demoValidate: () => validateLead(values, allowedServices) });
}

// Lead magnet landing pages (/lp/[service]/[magnet]): email required, first name optional.

export interface MagnetValues {
  firstName: string;
  email: string;
  /** Honeypot. Real people never see or fill this. */
  _gotcha: string;
}

export type MagnetField = Exclude<keyof MagnetValues, '_gotcha'>;
export type MagnetErrors = Partial<Record<MagnetField, string>>;
/** Visual order of the lead magnet form (email first), used to focus the first invalid field. */
export const MAGNET_FIELDS: MagnetField[] = ['email', 'firstName'];
export const EMPTY_MAGNET: MagnetValues = { firstName: '', email: '', _gotcha: '' };

export function validateMagnet(values: MagnetValues): MagnetErrors {
  const errors: MagnetErrors = {};
  const firstName = values.firstName.trim();
  if (firstName) {
    const badName = nameError(firstName, 50, 'first name');
    if (badName) errors.firstName = badName;
  }
  const badEmail = emailError(values.email.trim());
  if (badEmail) errors.email = badEmail;
  return errors;
}

interface MagnetSubmitOptions {
  endpoint?: string;
  simulate?: Simulation;
  magnet: { slug: string; title: string; service: string };
}

export async function submitMagnet(values: MagnetValues, { endpoint, simulate, magnet }: MagnetSubmitOptions): Promise<void> {
  if (values._gotcha) return;
  const payload = {
    firstName: values.firstName.trim(),
    email: values.email.trim(),
    _gotcha: values._gotcha,
    magnet: magnet.slug,
    service: magnet.service,
    _subject: `Lead magnet: ${magnet.title}`,
  };
  await sendForm(payload, { endpoint, simulate, fields: MAGNET_FIELDS, demoValidate: () => validateMagnet(values) });
}
