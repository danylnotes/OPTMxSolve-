import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateStory, scrub, normalizeCompany } from '../lib/validate.js';

const good = {
  company: 'Acme, Inc.',
  role: 'Engineer',
  story: 'My manager scheduled meetings at 11pm and expected replies within minutes, every single day.',
  tenure: '6m-1y',
  agree: true,
};

test('a post is just company + free text; no tags required', () => {
  const r = validateStory({ company: 'Acme', story: 'I quit because of the constant overtime.', agree: true });
  assert.equal(r.ok, true);
  assert.equal(r.value.companySlug, 'acme');
  assert.equal(r.value.reasons, undefined, 'themes come from the analyzer, not the author');
});

test('accepts a valid post and normalizes company', () => {
  const r = validateStory(good);
  assert.equal(r.ok, true);
  assert.equal(r.value.companySlug, 'acme');
  assert.equal(r.redactedCount, 0);
});

test('requires guideline agreement and a real company', () => {
  const r = validateStory({ ...good, agree: false });
  assert.ok(r.errors.agree);
  assert.ok(validateStory({ ...good, company: '!!' }).errors.company);
});

test('enforces length limits', () => {
  assert.ok(validateStory({ ...good, story: 'too short' }).errors.story);
  assert.ok(validateStory({ ...good, story: 'x'.repeat(5000) }).errors.story);
  assert.ok(validateStory({ ...good, tenure: 'forever' }).errors.tenure);
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

test('does not redact year ranges or small numbers', () => {
  assert.equal(scrub('From 2019-2020 I worked 60 hour weeks for 3 years.').redacted, 0);
});

test('normalizeCompany groups variants', () => {
  assert.equal(normalizeCompany('Globex Corporation'), normalizeCompany('globex'));
});
