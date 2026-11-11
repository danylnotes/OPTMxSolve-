import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server.js';
import { createAnalyzer } from '../lib/analyzer.js';
import { Store, AUTO_HIDE_REPORTS } from '../lib/store.js';

let server, base, app;
const store = new Store(null);
const ADMIN = 'test-admin-token';

before(async () => {
  app = createApp({ store, secret: 's', adminToken: ADMIN, analyzer: createAnalyzer({ apiKey: '' }), signupLimit: () => true, loginLimit: () => true });
  server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const call = async (path, { method = 'GET', body, headers = {}, cookie } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const sc = res.headers.get('set-cookie');
  return { status: res.status, body: await res.json().catch(() => null), setCookie: sc, cookie: sc ? sc.split(';')[0] : null, headers: res.headers };
};

let n = 0;
/** Register a fresh user and return { username, cookie }. */
async function signup(username = `user_${++n}`) {
  const r = await call('/api/auth/register', { method: 'POST', body: { username, password: 'correct-horse-battery' } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return { username, cookie: r.cookie };
}

const payload = {
  company: 'Initech',
  role: 'Analyst',
  story: 'Eight different managers asked me about the same report cover sheet every morning for a year. Total micromanagement and my manager yelled when I forgot it.',
  tenure: '1-3y',
  agree: true,
};
const post = (cookie, extra = {}) => call('/api/stories', { method: 'POST', body: { ...payload, ...extra }, cookie });

test('registration: validation, uniqueness (case-insensitive), cookie flags, no password leakage', async () => {
  assert.equal((await call('/api/auth/register', { method: 'POST', body: { username: 'ab', password: 'correct-horse-battery' } })).status, 422);
  assert.equal((await call('/api/auth/register', { method: 'POST', body: { username: 'has space', password: 'correct-horse-battery' } })).status, 422);
  assert.equal((await call('/api/auth/register', { method: 'POST', body: { username: 'Admin', password: 'correct-horse-battery' } })).status, 422, 'reserved');
  const weak = await call('/api/auth/register', { method: 'POST', body: { username: 'weakling', password: 'short' } });
  assert.ok(weak.body.errors.password);

  const ok = await call('/api/auth/register', { method: 'POST', body: { username: 'Alice_W', password: 'correct-horse-battery' } });
  assert.equal(ok.status, 201);
  assert.deepEqual(ok.body, { user: { username: 'Alice_W' } });
  assert.match(ok.setCookie, /HttpOnly/);
  assert.match(ok.setCookie, /SameSite=Lax/);

  const dupe = await call('/api/auth/register', { method: 'POST', body: { username: 'alice_w', password: 'correct-horse-battery' } });
  assert.equal(dupe.status, 409);
  assert.ok(dupe.body.errors.username);

  const stored = store.userByName('alice_w');
  assert.ok(stored.passHash.startsWith('scrypt$'));
  assert.doesNotMatch(JSON.stringify(store.data.sessions), /correct-horse/);
  const token = ok.cookie.split('=')[1];
  assert.ok(!(token in store.data.sessions), 'only a hash of the session token is stored');
});

test('login, me, logout', async () => {
  await signup('login_user');
  const bad = await call('/api/auth/login', { method: 'POST', body: { username: 'login_user', password: 'wrong-password' } });
  const ghost = await call('/api/auth/login', { method: 'POST', body: { username: 'nobody_here', password: 'whatever-123' } });
  assert.equal(bad.status, 401);
  assert.equal(ghost.status, 401);
  assert.equal(bad.body.error, ghost.body.error, 'does not reveal which usernames exist');

  const ok = await call('/api/auth/login', { method: 'POST', body: { username: 'LOGIN_USER', password: 'correct-horse-battery' } });
  assert.equal(ok.status, 200);
  assert.deepEqual((await call('/api/auth/me', { cookie: ok.cookie })).body, { user: { username: 'login_user' } });
  assert.deepEqual((await call('/api/auth/me')).body, { user: null });

  await call('/api/auth/logout', { method: 'POST', cookie: ok.cookie });
  assert.deepEqual((await call('/api/auth/me', { cookie: ok.cookie })).body, { user: null }, 'session is invalidated server-side');
});

test('login attempts are rate limited per client+username', async () => {
  const strict = createApp({ store: new Store(null), analyzer: createAnalyzer({ apiKey: '' }) });
  const s2 = http.createServer(strict);
  await new Promise((r) => s2.listen(0, r));
  const url = `http://127.0.0.1:${s2.address().port}/api/auth/login`;
  const codes = [];
  for (let i = 0; i < 12; i++) {
    codes.push((await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'victim', password: `guess-${i}-xxxx` }) })).status);
  }
  s2.close();
  assert.deepEqual(codes.slice(0, 10).every((c) => c === 401), true);
  assert.deepEqual(codes.slice(10), [429, 429]);
});

test('posting, relating and reporting require an account', async () => {
  assert.equal((await call('/api/stories', { method: 'POST', body: payload })).status, 401);
  const { cookie } = await signup();
  const created = await post(cookie);
  assert.equal(created.status, 201);
  const id = created.body.story.id;
  assert.equal((await call(`/api/stories/${id}/relate`, { method: 'POST' })).status, 401);
  assert.equal((await call(`/api/stories/${id}/report`, { method: 'POST', body: { reason: 'other' } })).status, 401);
  assert.equal((await call(`/api/stories/${id}`, { method: 'DELETE' })).status, 401);
  // Reading is public.
  assert.equal((await call(`/api/stories/${id}`)).status, 200);
});

test('post lifecycle: username shown, themes derived, ownership, relate toggle, delete', async () => {
  const author = await signup('story_author');
  const other = await signup();

  const bad = await post(author.cookie, { agree: false });
  assert.equal(bad.status, 422);
  assert.ok(bad.body.errors.agree);

  const created = await post(author.cookie);
  assert.equal(created.status, 201);
  const story = created.body.story;
  assert.equal(story.author, 'story_author');
  assert.equal(story.mine, true);
  assert.equal(story.createdAt.length, 10, 'timestamps are coarsened');
  assert.equal(story.userId, undefined, 'internal ids are not leaked');
  assert.equal(story.passHash, undefined);

  await app.idle();
  const seen = (await call(`/api/stories/${story.id}`, { cookie: other.cookie })).body.story;
  assert.equal(seen.author, 'story_author');
  assert.equal(seen.mine, false);
  assert.ok(seen.reasons.includes('micromanagement'), 'themes are derived from the text');
  assert.ok(seen.title.length > 0);

  assert.equal((await call('/api/stories?q=cover')).body.total >= 1, true);
  assert.equal((await call('/api/stories?reason=micromanagement')).body.items.some((s) => s.id === story.id), true);

  // one vote per account, toggles
  assert.deepEqual((await call(`/api/stories/${story.id}/relate`, { method: 'POST', cookie: other.cookie })).body, { count: 1, related: true });
  assert.equal((await call(`/api/stories/${story.id}`, { cookie: other.cookie })).body.story.related, true);
  assert.deepEqual((await call(`/api/stories/${story.id}/relate`, { method: 'POST', cookie: other.cookie })).body, { count: 0, related: false });

  // only the owner can delete
  assert.equal((await call(`/api/stories/${story.id}`, { method: 'DELETE', cookie: other.cookie })).status, 403);
  assert.equal((await call(`/api/stories/${story.id}`, { method: 'DELETE', cookie: author.cookie })).status, 200);
  assert.equal((await call(`/api/stories/${story.id}`)).status, 404);
  assert.equal(store.get(story.id).story, '', 'content is wiped on delete');
});

test('anonymous option hides the username everywhere public, but the owner keeps control', async () => {
  const author = await signup('shy_author');
  const created = await post(author.cookie, { anonymous: true });
  const id = created.body.story.id;
  assert.equal(created.body.story.author, null);
  assert.equal((await call(`/api/stories/${id}`)).body.story.author, null);
  assert.equal(created.body.story.mine, true, 'author can still manage it');

  const profile = await call('/api/users/shy_author');
  assert.equal(profile.status, 200);
  assert.deepEqual(profile.body.items, [], 'anonymous posts never appear on the profile');
  assert.equal((await call(`/api/stories/${id}`, { method: 'DELETE', cookie: author.cookie })).status, 200);
});

test('profile page lists a user\'s public posts', async () => {
  const author = await signup('profile_person');
  await post(author.cookie);
  const p = await call('/api/users/profile_person');
  assert.equal(p.body.user.username, 'profile_person');
  assert.equal(p.body.items.length, 1);
  assert.equal(p.body.items[0].author, 'profile_person');
  assert.equal(p.body.user.passHash, undefined);
  assert.equal((await call('/api/users/not_a_user')).status, 404);
});

test('company stats, similar firms and patterns endpoints', async () => {
  const { cookie } = await signup();
  await post(cookie);
  const company = await call('/api/companies/initech');
  assert.ok(company.body.count >= 1);
  assert.ok(Array.isArray(company.body.similar));
  assert.ok(Array.isArray((await call('/api/patterns')).body.items));
});

test('reports auto-hide (one vote per account), moderators see the account, restore and ban', async () => {
  const author = await signup('reported_author');
  const id = (await post(author.cookie)).body.story.id;
  const reporters = [];
  for (let i = 0; i < AUTO_HIDE_REPORTS; i++) reporters.push(await signup());

  assert.equal((await call(`/api/stories/${id}/report`, { method: 'POST', body: { reason: 'bogus' }, cookie: reporters[0].cookie })).status, 422);
  await call(`/api/stories/${id}/report`, { method: 'POST', body: { reason: 'names_individual' }, cookie: reporters[0].cookie });
  await call(`/api/stories/${id}/report`, { method: 'POST', body: { reason: 'names_individual' }, cookie: reporters[0].cookie });
  assert.equal(store.get(id).reports.length, 1, 'same account reporting twice counts once');
  for (const r of reporters.slice(1)) await call(`/api/stories/${id}/report`, { method: 'POST', body: { reason: 'other' }, cookie: r.cookie });
  assert.equal((await call(`/api/stories/${id}`)).status, 404, 'hidden after enough reports');

  assert.equal((await call('/api/admin/queue')).status, 401);
  const auth = { authorization: `Bearer ${ADMIN}` };
  const queue = await call('/api/admin/queue', { headers: auth });
  const item = queue.body.items.find((s) => s.id === id);
  assert.equal(item.account, 'reported_author');
  assert.equal(item.reports[0].voter, undefined, 'reporter ids not exposed');

  await call(`/api/admin/stories/${id}`, { method: 'POST', body: { action: 'restore' }, headers: auth });
  assert.equal((await call(`/api/stories/${id}`)).status, 200);

  // ban: sessions end, login blocked, posts hidden
  assert.equal((await call('/api/admin/users/reported_author/ban', { method: 'POST' })).status, 401);
  const banned = await call('/api/admin/users/reported_author/ban', { method: 'POST', headers: auth });
  assert.equal(banned.status, 200);
  assert.equal(banned.body.hidden, 1);
  assert.deepEqual((await call('/api/auth/me', { cookie: author.cookie })).body, { user: null });
  assert.equal((await call('/api/auth/login', { method: 'POST', body: { username: 'reported_author', password: 'correct-horse-battery' } })).status, 401);
  assert.equal((await call(`/api/stories/${id}`)).status, 404);
  assert.equal((await call('/api/users/reported_author')).status, 404);
});

test('posting is rate limited per account', async () => {
  const { cookie } = await signup();
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await post(cookie)).status);
  assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429]);
  // another account is unaffected
  assert.equal((await post((await signup()).cookie)).status, 201);
});

test('static files, security headers and path traversal', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
  const trav = await fetch(`${base}/..%2f..%2fpackage.json`);
  assert.notEqual(trav.status, 200);
  assert.equal((await call('/api/nope')).status, 404);
});
