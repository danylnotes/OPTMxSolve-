// Input validation + privacy scrubbing for LinkedOut stories.
//
// The product's core risk is people doxxing themselves or naming private
// individuals. The MVP handles that in three layers:
//   1. Client-side guidelines + a required attestation checkbox.
//   2. Server-side redaction of contact details (emails, phones, URLs, handles).
//   3. Community reporting with auto-hide, plus an admin moderation queue.

export const REASONS = Object.freeze({
  toxic_management: 'Toxic management',
  burnout: 'Burnout / overwork',
  underpaid: 'Underpaid',
  no_growth: 'No growth path',
  harassment: 'Harassment',
  discrimination: 'Discrimination',
  unethical: 'Unethical practices',
  culture: 'Toxic culture / cliques',
  micromanagement: 'Micromanagement',
  broken_promises: 'Broken promises',
  instability: 'Layoffs / instability',
  rto: 'Forced RTO / no flexibility',
});

export const TENURES = Object.freeze({
  lt6m: '< 6 months',
  '6m-1y': '6–12 months',
  '1-3y': '1–3 years',
  '3-5y': '3–5 years',
  gt5y: '5+ years',
});

export const LIMITS = Object.freeze({
  company: { min: 2, max: 80 },
  role: { max: 80 },
  story: { min: 20, max: 3000 },
});

const REDACTIONS = [
  // emails
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email removed]'],
  // URLs
  [/\b(?:https?:\/\/|www\.)\S+/gi, '[link removed]'],
  // phone numbers: 9+ digits with common separators (avoids year ranges like 2019-2020)
  [/\+?\(?\d(?:[\s().-]{0,2}\d){8,}/g, '[phone removed]'],
  // social handles like @someone
  [/(^|\s)@[A-Za-z0-9_]{2,}/g, '$1[handle removed]'],
];

/** Remove contact details. Returns { text, redacted } */
export function scrub(text) {
  let out = text;
  let redacted = 0;
  for (const [re, repl] of REDACTIONS) {
    out = out.replace(re, (...m) => {
      redacted++;
      return typeof repl === 'string' ? repl.replace('$1', m[1] ?? '') : repl;
    });
  }
  return { text: out, redacted };
}

const clean = (v) =>
  typeof v === 'string'
    ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim()
    : '';

export function normalizeCompany(name) {
  return clean(name)
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\b(inc|llc|ltd|corp|corporation|co|gmbh|plc)\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate a new post. A post is just a company + free text: themes, sentiment
 * and the headline are derived afterwards by the analyzer, not entered by hand.
 * Returns { ok: true, value, redactedCount } or { ok: false, errors }.
 */
export function validateStory(input) {
  const errors = {};
  const body = input && typeof input === 'object' ? input : {};

  const company = clean(body.company);
  const role = clean(body.role);
  const story = clean(body.story).replace(/\n{3,}/g, '\n\n');
  const tenure = clean(body.tenure);

  const len = (name, val, { min = 0, max }) => {
    if (val.length < min) errors[name] = min > 1 ? `Must be at least ${min} characters.` : 'Required.';
    else if (val.length > max) errors[name] = `Must be at most ${max} characters.`;
  };
  len('company', company, LIMITS.company);
  len('role', role, LIMITS.role);
  len('story', story, LIMITS.story);

  if (!normalizeCompany(company) && !errors.company) errors.company = 'Enter a real company name.';
  if (tenure && !(tenure in TENURES)) errors.tenure = 'Pick a tenure from the list.';
  if (body.agree !== true) errors.agree = 'You must agree to the posting guidelines.';

  if (Object.keys(errors).length) return { ok: false, errors };

  let redactedCount = 0;
  const s = (t) => {
    const r = scrub(t);
    redactedCount += r.redacted;
    return r.text;
  };

  return {
    ok: true,
    value: {
      company,
      companySlug: normalizeCompany(company),
      role: s(role),
      story: s(story),
      tenure: tenure || null,
    },
    redactedCount,
  };
}

export const REPORT_REASONS = Object.freeze({
  names_individual: 'Names or identifies a private individual',
  personal_info: 'Contains personal / contact info',
  false_or_spam: 'Spam or clearly fake',
  hateful: 'Hateful or harassing',
  other: 'Other',
});
