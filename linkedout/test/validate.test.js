import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateStory, scrub, normalizeCompany } from '../lib/validate.js';

const good = {
  company: 'Acme, Inc.',
  role: 'Engineer',
  title: 'Burned out in a year',
  story: 'My manager scheduled meetings at 11pm and expected replies within minutes, every single day.',
  advice: 'Ask about on-call during the interview.',
  tenure: '6m-1y',
  rating: 2,
  reasons: ['burnout', 'toxic_management'],
  agree: true,
};

test('accepts a valid story and normalizes company', () => {
  const r = validateStory(good);
  assert.equal(r.ok, true);
  assert.equal(r.value.companySlug, 'acme');
  assert.equal(r.redactedCount, 0);
});

test('requires guideline agreement, reasons and rating', () => {
  const r = validateStory({ ...good, agree: false, reasons: [], rating: 9 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.agree && r.errors.reasons && r.errors.rating);
});

test('rejects unknown reasons and too many reasons', () => {
  assert.ok(validateStory({ ...good, reasons: ['nope'] }).errors.reasons);
  assert.ok(validateStory({ ...good, reasons: ['burnout', 'underpaid', 'no_growth', 'culture', 'rto', 'harassment'] }).errors.reasons);
});

test('enforces length limits', () => {
  assert.ok(validateStory({ ...good, story: 'too short' }).errors.story);
  assert.ok(validateStory({ ...good, title: 'x'.repeat(500) }).errors.title);
  assert.ok(validateStory({ ...good, company: '!!' }).errors.company);
});

test('scrubs emails, phones, links and handles', () => {
  const { text, redacted } = scrub('mail me a@b.co or call +1 (555) 123-4567, see https://x.io/p or ping @jdoe');
  assert.equal(redacted, 4);
  assert.doesNotMatch(text, /a@b\.co|555|https|@jdoe/);
});

test('redaction is applied to stored story fields', () => {
  const r = validateStory({ ...good, story: `${good.story} Email hr at hr@acme.com for proof.` });
  assert.equal(r.ok, true);
  assert.equal(r.redactedCount, 1);
  assert.match(r.value.story, /\[email removed\]/);
});

test('normalizeCompany groups variants', () => {
  assert.equal(normalizeCompany('Globex Corporation'), normalizeCompany('globex'));
});

test('does not redact year ranges or small numbers', () => {
  assert.equal(scrub('From 2019-2020 I worked 60 hour weeks for 3 years.').redacted, 0);
});
