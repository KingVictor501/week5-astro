// Book a Call lead form: shared validation + submission.
// The same validateLead() runs in the browser and in the demo "server", and Formspree
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MESSAGE_MAX = 2000;

export function validateLead(values: LeadValues, allowedServices: string[]): LeadErrors {
  const errors: LeadErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const website = values.website.trim();

  if (!name) errors.name = 'Enter your name.';
  else if (name.length > 100) errors.name = 'Keep your name under 100 characters.';

  if (!email) errors.email = 'Enter your email address.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter an email address like name@example.com.';

  if (website) {
    try {
      const url = new URL(website.includes('://') ? website : `https://${website}`);
      if (!/^https?:$/.test(url.protocol) || !url.hostname.includes('.')) throw new Error('bad url');
    } catch {
      errors.website = 'Enter a website address like example.com.';
    }
  }

  if (values.service && !allowedServices.includes(values.service)) errors.service = 'Choose a service from the list.';
  if (values.budget && !BUDGET_OPTIONS.includes(values.budget)) errors.budget = 'Choose a budget range from the list.';

  if (values.contactMethod !== 'email' && values.contactMethod !== 'phone') {
    errors.contactMethod = 'Choose how you would like me to contact you.';
  }
  if (values.contactMethod === 'phone') {
    const digits = values.phone.replace(/\D/g, '');
    if (!digits) errors.phone = 'Enter a phone number so I can call you.';
    else if (digits.length < 7 || digits.length > 15) errors.phone = 'Enter a valid phone number, including area code.';
  }

  if (values.message.length > MESSAGE_MAX) errors.message = `Keep your message under ${MESSAGE_MAX} characters.`;
  return errors;
}

export type FailureKind = 'network' | 'server' | 'rate-limit' | 'validation';

export class LeadSubmitError extends Error {
  kind: FailureKind;
  fieldErrors: LeadErrors;

  constructor(kind: FailureKind, fieldErrors: LeadErrors = {}) {
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

  if (!endpoint) {
    // Demo mode: mimic a real backend, including server-side validation.
    await wait(1200);
    if (simulate === 'network-error') throw new LeadSubmitError('network');
    if (simulate === 'server-error') throw new LeadSubmitError('server');
    if (simulate === 'rate-limit') throw new LeadSubmitError('rate-limit');
    const serverErrors = validateLead(values, allowedServices);
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
    const fieldErrors: LeadErrors = {};
    for (const error of body.errors ?? []) {
      if (error.field && (FIELD_ORDER as string[]).includes(error.field)) {
        fieldErrors[error.field as LeadField] = error.message ?? 'Check this field.';
      }
    }
    throw new LeadSubmitError(Object.keys(fieldErrors).length > 0 ? 'validation' : 'server', fieldErrors);
  }
  throw new LeadSubmitError('server');
}
