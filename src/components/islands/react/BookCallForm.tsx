import { useEffect, useRef, useState, type ChangeEvent, type ReactNode, type SubmitEvent } from 'react';
import { PUBLIC_FORMSPREE_ENDPOINT } from 'astro:env/client';
import {
  BUDGET_OPTIONS,
  EMPTY_LEAD,
  FAILURE_COPY,
  FIELD_ORDER,
  LeadSubmitError,
  SIMULATIONS,
  submitLead,
  validateLead,
  type FailureKind,
  type LeadErrors,
  type LeadField,
  type LeadValues,
  type Simulation,
  liveErrors,
} from '../../../lib/lead';
import './LeadForm.css';

interface Props {
  services: { value: string; label: string }[];
  callLength: string;
  replyTime: string;
  contactEmail: string | null;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function BookCallForm({ services, callLength, replyTime, contactEmail }: Props) {
  const allowed = services.map((s) => s.value);
  const demo = !PUBLIC_FORMSPREE_ENDPOINT;

  const [values, setValues] = useState<LeadValues>(EMPTY_LEAD);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [failure, setFailure] = useState<Exclude<FailureKind, 'validation'> | null>(null);
  const [focusFirstError, setFocusFirstError] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  const simulate = useRef<Simulation | undefined>(undefined);
  const fields = useRef<Partial<Record<LeadField, HTMLElement | null>>>({});
  const successHeading = useRef<HTMLHeadingElement>(null);
  const errorPanel = useRef<HTMLDivElement>(null);

  // Pre-fill the service from ?service=slug. In demo mode, ?simulate= forces a failure for testing.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get('service');
    if (service && allowed.includes(service)) setValues((v) => ({ ...v, service }));
    const sim = params.get('simulate') as Simulation | null;
    if (demo && sim && SIMULATIONS.includes(sim)) simulate.current = sim;
  }, []);

  useEffect(() => {
    if (!focusFirstError) return;
    const first = FIELD_ORDER.find((field) => errors[field]);
    if (first) fields.current[first]?.focus();
  }, [focusFirstError]);

  useEffect(() => {
    if (status === 'success') successHeading.current?.focus();
    if (status === 'error') errorPanel.current?.focus();
  }, [status]);

  const register = (field: LeadField) => (el: HTMLElement | null) => {
    fields.current[field] = el;
  };

  const update =
    (field: keyof LeadValues) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const next = { ...values, [field]: event.target.value };
      setValues(next);
      // A field cleared while typing shows no error; "required" messages only come from Submit.
      const blank = !event.target.value.trim();
      if (attempted) setErrors((prev) => liveErrors(prev, validateLead(next, allowed), next, field));
      else if (blank) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  // Before the first submit, only validate a field once the person has typed in it and moved on.
  // Blank fields are left as they are: typing already cleared them, and Submit handles required fields.
  const validateOnBlur = (field: LeadField) => () => {
    if (!values[field].trim()) return;
    const fieldError = validateLead(values, allowed)[field];
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  async function send() {
    setStatus('submitting');
    setFailure(null);
    setAnnouncement('Sending your request…');
    try {
      await submitLead(values, { endpoint: PUBLIC_FORMSPREE_ENDPOINT, allowedServices: allowed, simulate: simulate.current });
      setAnnouncement('');
      setStatus('success');
    } catch (error) {
      // A simulated failure only applies to the first attempt, so "Try again" can be tested too.
      simulate.current = undefined;
      const kind = error instanceof LeadSubmitError ? error.kind : 'server';
      if (kind === 'validation' && error instanceof LeadSubmitError) {
        setErrors(error.fieldErrors as LeadErrors);
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
    const found = validateLead(values, allowed);
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
    const firstName = values.name.trim().split(/\s+/)[0];
    return (
      <div className="lead-success">
        <h2 ref={successHeading} tabIndex={-1}>
          Thanks, {firstName}! Your request is in.
        </h2>
        {demo && <p className="lead-demo">Demo mode: this request was not sent anywhere.</p>}
        <h3>What happens next</h3>
        <ol>
          <li>I'll review your details and look at your website if you shared it.</li>
          <li>
            You'll hear from me within {replyTime} by {values.contactMethod === 'phone' ? 'phone' : 'email'} to
            schedule your {callLength} call.
          </li>
          <li>On the call, we'll talk through your goals and the first steps I'd recommend.</li>
        </ol>
        <p>While you wait:</p>
        <ul>
          <li>
            <a href="/blog">Read practical marketing articles on the blog</a>
          </li>
          <li>
            <a href="/#roi-calculator">Estimate what wasted ad spend may be costing you</a>
          </li>
        </ul>
      </div>
    );
  }

  const submitting = status === 'submitting';
  const describedBy = (field: LeadField, hint?: boolean) =>
    [hint ? `lead-${field}-hint` : '', errors[field] ? `lead-${field}-error` : ''].filter(Boolean).join(' ') || undefined;
  const errorText = (field: LeadField) =>
    errors[field] ? (
      <p id={`lead-${field}-error`} className="lead-error">
        <span aria-hidden="true">⚠ </span>
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="lead">
      {demo && (
        <p className="lead-demo">
          Demo mode: this form isn't connected to a backend yet, so requests aren't sent. To reach me now, email{' '}
          {fallback}.
        </p>
      )}

      {status === 'error' && failure && (
        <div className="lead-alert" ref={errorPanel} tabIndex={-1} aria-labelledby="lead-alert-title">
          <h2 id="lead-alert-title">{FAILURE_COPY[failure].title}</h2>
          <p>{FAILURE_COPY[failure].text}</p>
          <div className="lead-alert-actions">
            <button type="button" className="btn btn-primary" onClick={() => void send()}>
              Try again
            </button>
            <p>Prefer email? Reach me at {fallback}.</p>
          </div>
        </div>
      )}

      {/* POST (never GET) so a submit before hydration can't put personal data in the URL.
          With Formspree configured, the plain HTML form also works without JavaScript. */}
      <form
        className="lead-form"
        method="post"
        action={PUBLIC_FORMSPREE_ENDPOINT || undefined}
        noValidate
        onSubmit={onSubmit}
        aria-busy={submitting}
        aria-labelledby="lead-form-title"
      >
        <h2 id="lead-form-title" className="visually-hidden">
          Book a call request form
        </h2>
        <p className="lead-required-note">
          Fields marked <span aria-hidden="true">*</span>
          <span className="visually-hidden">with an asterisk</span> are required.
        </p>

        <div className="lead-grid">
          <div className="lead-field">
            <label htmlFor="lead-name">
              Name <span aria-hidden="true">*</span>
            </label>
            <input
              id="lead-name"
              name="name"
              type="text"
              autoComplete="name"
              aria-required="true"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy('name')}
              value={values.name}
              onChange={update('name')}
              onBlur={validateOnBlur('name')}
              ref={register('name')}
            />
            {errorText('name')}
          </div>

          <div className="lead-field">
            <label htmlFor="lead-email">
              Email <span aria-hidden="true">*</span>
            </label>
            <input
              id="lead-email"
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
              ref={register('email')}
            />
            {errorText('email')}
          </div>

          <div className="lead-field">
            <label htmlFor="lead-company">Company</label>
            <input
              id="lead-company"
              name="company"
              type="text"
              autoComplete="organization"
              aria-invalid={errors.company ? true : undefined}
              aria-describedby={describedBy('company')}
              value={values.company}
              onChange={update('company')}
              onBlur={validateOnBlur('company')}
              ref={register('company')}
            />
            {errorText('company')}
          </div>

          <div className="lead-field">
            <label htmlFor="lead-website">Website</label>
            <input
              id="lead-website"
              name="website"
              type="text"
              inputMode="url"
              autoComplete="url"
              aria-invalid={errors.website ? true : undefined}
              aria-describedby={describedBy('website')}
              value={values.website}
              onChange={update('website')}
              onBlur={validateOnBlur('website')}
              ref={register('website')}
            />
            {errorText('website')}
          </div>

          <div className="lead-field">
            <label htmlFor="lead-service">Service of interest</label>
            <select
              id="lead-service"
              name="service"
              aria-invalid={errors.service ? true : undefined}
              aria-describedby={describedBy('service')}
              value={values.service}
              onChange={update('service')}
              ref={register('service')}
            >
              <option value="">Select a service</option>
              {services.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {errorText('service')}
          </div>

          <div className="lead-field">
            <label htmlFor="lead-budget">Monthly marketing budget</label>
            <select
              id="lead-budget"
              name="budget"
              aria-invalid={errors.budget ? true : undefined}
              aria-describedby={describedBy('budget')}
              value={values.budget}
              onChange={update('budget')}
              ref={register('budget')}
            >
              <option value="">Select a range</option>
              {BUDGET_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {errorText('budget')}
          </div>

          <fieldset className="lead-field lead-wide lead-radios" aria-describedby={describedBy('contactMethod')}>
            <legend>Preferred contact method</legend>
            <div className="lead-radio-row">
              {(['email', 'phone'] as const).map((method, index) => (
                <label key={method} className="lead-radio">
                  <input
                    type="radio"
                    name="contactMethod"
                    value={method}
                    checked={values.contactMethod === method}
                    onChange={update('contactMethod')}
                    ref={index === 0 ? register('contactMethod') : undefined}
                  />
                  {method === 'email' ? 'Email' : 'Phone'}
                </label>
              ))}
            </div>
            {errorText('contactMethod')}
          </fieldset>

          {values.contactMethod === 'phone' && (
            <div className="lead-field lead-wide">
              <label htmlFor="lead-phone">
                Phone number <span aria-hidden="true">*</span>
              </label>
              <input
                id="lead-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                aria-required="true"
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={describedBy('phone')}
                value={values.phone}
                onChange={update('phone')}
                onBlur={validateOnBlur('phone')}
                ref={register('phone')}
              />
              {errorText('phone')}
            </div>
          )}

          <div className="lead-field lead-wide">
            <label htmlFor="lead-message">What would you like help with?</label>
            <p id="lead-message-hint" className="lead-hint">
              Optional. A sentence or two about your goals is plenty.
            </p>
            <textarea
              id="lead-message"
              name="message"
              rows={5}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={describedBy('message', true)}
              value={values.message}
              onChange={update('message')}
              onBlur={validateOnBlur('message')}
              ref={register('message')}
            />
            {errorText('message')}
          </div>

          {/* Honeypot: hidden from people and assistive tech; bots tend to fill every field. */}
          <div className="lead-hp" aria-hidden="true">
            <label htmlFor="lead-gotcha">Leave this field empty</label>
            <input
              id="lead-gotcha"
              name="_gotcha"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values._gotcha}
              onChange={update('_gotcha')}
            />
          </div>
        </div>

        {/* preventDefault on mousedown keeps focus in the current field, so its blur validation can't
            add or remove an error message and shift this button out from under the pointer mid-click.
            The submit handler validates every field anyway. */}
        <button
          type="submit"
          className="btn btn-primary btn-lg lead-submit"
          aria-disabled={submitting}
          onMouseDown={(event) => event.preventDefault()}
        >
          {submitting ? (
            <>
              <span className="lead-spinner" aria-hidden="true" />
              Sending…
            </>
          ) : (
            'Request my call'
          )}
        </button>
        <p className="lead-privacy">I'll only use your details to reply to your request.</p>
      </form>

      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
