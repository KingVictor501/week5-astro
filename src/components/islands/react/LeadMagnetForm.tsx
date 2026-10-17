import { useEffect, useRef, useState, type ChangeEvent, type ReactNode, type SubmitEvent } from 'react';
import { PUBLIC_FORMSPREE_ENDPOINT } from 'astro:env/client';
import {
  EMPTY_MAGNET,
  FAILURE_COPY,
  LeadSubmitError,
  MAGNET_FIELDS,
  SIMULATIONS,
  submitMagnet,
  validateMagnet,
  type FailureKind,
  type MagnetErrors,
  type MagnetField,
  type MagnetValues,
  type Simulation,
} from '../../../lib/lead';
import './LeadForm.css';

interface Props {
  magnet: { slug: string; title: string; typeLabel: string; file: string };
  service: { slug: string; name: string };
  contactEmail: string | null;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Lead magnet form for /lp/ pages: email required, first name optional.
 * Same validation, failure handling, and demo mode as the Book a Call form (src/lib/lead.ts).
 */
export default function LeadMagnetForm({ magnet, service, contactEmail }: Props) {
  const demo = !PUBLIC_FORMSPREE_ENDPOINT;

  const [values, setValues] = useState<MagnetValues>(EMPTY_MAGNET);
  const [errors, setErrors] = useState<MagnetErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [failure, setFailure] = useState<Exclude<FailureKind, 'validation'> | null>(null);
  const [focusFirstError, setFocusFirstError] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  const simulate = useRef<Simulation | undefined>(undefined);
  const fields = useRef<Partial<Record<MagnetField, HTMLInputElement | null>>>({});
  const successHeading = useRef<HTMLHeadingElement>(null);
  const errorPanel = useRef<HTMLDivElement>(null);

  // In demo mode, ?simulate= forces a failure for testing.
  useEffect(() => {
    const sim = new URLSearchParams(window.location.search).get('simulate') as Simulation | null;
    if (demo && sim && SIMULATIONS.includes(sim)) simulate.current = sim;
  }, []);

  useEffect(() => {
    if (!focusFirstError) return;
    const first = MAGNET_FIELDS.find((field) => errors[field]);
    if (first) fields.current[first]?.focus();
  }, [focusFirstError]);

  useEffect(() => {
    if (status === 'success') successHeading.current?.focus();
    if (status === 'error') errorPanel.current?.focus();
  }, [status]);

  const update = (field: keyof MagnetValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const next = { ...values, [field]: event.target.value };
    setValues(next);
    if (attempted) setErrors(validateMagnet(next));
  };

  // Before the first submit, only validate a field once the person has typed in it and moved on.
  const validateOnBlur = (field: MagnetField) => () => {
    if (!attempted && !values[field]) return;
    setErrors((prev) => ({ ...prev, [field]: validateMagnet(values)[field] }));
  };

  async function send() {
    setStatus('submitting');
    setFailure(null);
    setAnnouncement('Sending…');
    try {
      await submitMagnet(values, {
        endpoint: PUBLIC_FORMSPREE_ENDPOINT,
        simulate: simulate.current,
        magnet: { slug: magnet.slug, title: magnet.title, service: service.slug },
      });
      setAnnouncement('');
      setStatus('success');
    } catch (error) {
      // A simulated failure only applies to the first attempt, so "Try again" can be tested too.
      simulate.current = undefined;
      const kind = error instanceof LeadSubmitError ? error.kind : 'server';
      if (kind === 'validation' && error instanceof LeadSubmitError) {
        setErrors(error.fieldErrors as MagnetErrors);
        setAttempted(true);
        setStatus('idle');
        setAnnouncement('Some fields need attention.');
        setFocusFirstError((n) => n + 1);
        return;
      }
      setAnnouncement('');
      setFailure(kind as Exclude<FailureKind, 'validation'>);
      setStatus('error');
    }
  }

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;
    setAttempted(true);
    const found = validateMagnet(values);
    setErrors(found);
    const count = Object.keys(found).length;
    if (count > 0) {
      setAnnouncement(`${count} ${count === 1 ? 'field needs' : 'fields need'} attention.`);
      setFocusFirstError((n) => n + 1);
      return;
    }
    void send();
  }

  const fallback: ReactNode = contactEmail ? (
    <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
  ) : (
    <span>[REPLACE: contact email]</span>
  );

  if (status === 'success') {
    const firstName = values.firstName.trim().split(/\s+/)[0];
    const hasFile = /^https?:\/\//.test(magnet.file);
    return (
      <div className="lead-success lm-success">
        <h2 ref={successHeading} tabIndex={-1}>
          {firstName ? `Thanks, ${firstName}! ` : ''}Your {magnet.typeLabel} is ready.
        </h2>
        {demo && <p className="lead-demo">Demo mode: your email was not sent anywhere.</p>}
        {hasFile ? (
          <a className="btn btn-primary btn-lg lm-download" href={magnet.file}>
            Download the {magnet.title}
          </a>
        ) : (
          <p className="lead-demo">
            <strong>Download link:</strong> {magnet.file}
          </p>
        )}
        <p>
          Want help putting it to work?{' '}
          <a href={`/book-a-call?service=${service.slug}`}>Book a free {service.name.toLowerCase()} call</a>.
        </p>
      </div>
    );
  }

  const submitting = status === 'submitting';
  const describedBy = (field: MagnetField) => (errors[field] ? `lm-${field}-error` : undefined);
  const errorText = (field: MagnetField) =>
    errors[field] ? (
      <p id={`lm-${field}-error`} className="lead-error">
        <span aria-hidden="true">⚠ </span>
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="lead">
      {status === 'error' && failure && (
        <div className="lead-alert" ref={errorPanel} tabIndex={-1} aria-labelledby="lm-alert-title">
          <h2 id="lm-alert-title">{FAILURE_COPY[failure].title}</h2>
          <p>{FAILURE_COPY[failure].text}</p>
          <div className="lead-alert-actions">
            <button type="button" className="btn btn-primary" onClick={() => void send()}>
              Try again
            </button>
            <p>Prefer email? Reach me at {fallback}.</p>
          </div>
        </div>
      )}

      {/* POST (never GET) so a submit before hydration can't put an email address in the URL. */}
      <form
        className="lead-form lm-form"
        method="post"
        action={PUBLIC_FORMSPREE_ENDPOINT || undefined}
        noValidate
        onSubmit={onSubmit}
        aria-busy={submitting}
        aria-labelledby="lm-form-title"
      >
        <h2 id="lm-form-title" className="lm-form-title">
          Get the free {magnet.typeLabel}
        </h2>
        {demo && <p className="lead-demo">Demo mode: this form isn't connected yet, so nothing is sent.</p>}

        <div className="lm-fields">
          <div className="lead-field">
            <label htmlFor="lm-email">
              Email <span aria-hidden="true">*</span>
              <span className="visually-hidden">(required)</span>
            </label>
            <input
              id="lm-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              aria-required="true"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy('email')}
              value={values.email}
              onChange={update('email')}
              onBlur={validateOnBlur('email')}
              ref={(el) => {
                fields.current.email = el;
              }}
            />
            {errorText('email')}
          </div>

          <div className="lead-field">
            <label htmlFor="lm-firstName">
              First name <span className="lm-optional">(optional)</span>
            </label>
            <input
              id="lm-firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              aria-invalid={errors.firstName ? true : undefined}
              aria-describedby={describedBy('firstName')}
              value={values.firstName}
              onChange={update('firstName')}
              onBlur={validateOnBlur('firstName')}
              ref={(el) => {
                fields.current.firstName = el;
              }}
            />
            {errorText('firstName')}
          </div>

          {/* Honeypot: hidden from people and assistive tech; bots tend to fill every field. */}
          <div className="lead-hp" aria-hidden="true">
            <label htmlFor="lm-gotcha">Leave this field empty</label>
            <input
              id="lm-gotcha"
              name="_gotcha"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values._gotcha}
              onChange={update('_gotcha')}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg lead-submit" aria-disabled={submitting}>
          {submitting ? (
            <>
              <span className="lead-spinner" aria-hidden="true" />
              Sending…
            </>
          ) : (
            `Send me the ${magnet.typeLabel}`
          )}
        </button>
        <p className="lead-privacy">
          I'll only use your email to send this {magnet.typeLabel} and occasional tips. Unsubscribe anytime, and I never
          share or sell your email.
        </p>
      </form>

      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
