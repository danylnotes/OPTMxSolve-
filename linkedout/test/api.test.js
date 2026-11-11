import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server.js';
import { Store, AUTO_HIDE_REPORTS } from '../lib/store.js';

let server, base;
const store = new Store(null);
const ADMIN = 'test-admin-token';

before(async () => {
  server = http.createServer(createApp({ store, secret: 's', adminToken: ADMIN }));
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
  return { status: res.status, body: await res.json().catch(() => null), setCookie: res.headers.get('set-cookie') };
};
const cookieFrom = (sc) => sc.split(';')[0];

const payload = {
  company: 'Initech',
  role: 'Analyst',
  title: 'TPS reports forever',
  story: 'Eight different managers asked me about the same report cover sheet every morning for a year.',
  rating: 1,
  reasons: ['micromanagement', 'toxic_management'],
  tenure: '1-3y',
  agree: true,
};

test('full story lifecycle', async () => {
  const bad = await call('/api/stories', { method: 'POST', body: { ...payload, agree: false } });
  assert.equal(bad.status, 422);
  assert.ok(bad.body.errors.agree);

  const created = await call('/api/stories', { method: 'POST', body: payload });
  assert.equal(created.status, 201);
  const { story, deleteToken } = created.body;
  assert.ok(deleteToken);
  assert.equal(story.relates, 0);
  assert.equal(story.createdAt.length, 10, 'timestamps are coarsened');
  assert.equal(story.deleteTokenHash, undefined, 'internal fields are not leaked');

  const list = await call('/api/stories?q=tps');
  assert.equal(list.body.total, 1);
  assert.equal((await call('/api/stories?reason=burnout')).body.total, 0);

  // relate toggles per voter
  const first = await call(`/api/stories/${story.id}/relate`, { method: 'POST' });
  const cookie = cookieFrom(first.setCookie);
  assert.deepEqual(first.body, { count: 1, related: true });
  const again = await call(`/api/stories/${story.id}/relate`, { method: 'POST', cookie });
  assert.deepEqual(again.body, { count: 0, related: false });

  // company stats
  const company = await call('/api/companies/initech');
  assert.equal(company.body.count, 1);
  assert.equal(company.body.topReasons[0].pct, 100);

  // delete with wrong / right token
  assert.equal((await call(`/api/stories/${story.id}`, { method: 'DELETE', headers: { 'x-delete-token': 'nope' } })).status, 403);
  assert.equal((await call(`/api/stories/${story.id}`, { method: 'DELETE', headers: { 'x-delete-token': deleteToken } })).status, 200);
  assert.equal((await call(`/api/stories/${story.id}`)).status, 404);
  assert.equal(store.get(story.id).story, '', 'content is wiped on delete');
});

test('reports auto-hide and moderators can restore', async () => {
  const { body } = await call('/api/stories', { method: 'POST', body: payload });
  const id = body.story.id;
  assert.equal((await call(`/api/stories/${id}/report`, { method: 'POST', body: { reason: 'bogus' } })).status, 422);
  // Same voter reporting twice only counts once.
  const r1 = await call(`/api/stories/${id}/report`, { method: 'POST', body: { reason: 'names_individual' } });
  const c = cookieFrom(r1.setCookie);
  await call(`/api/stories/${id}/report`, { method: 'POST', body: { reason: 'names_individual' }, cookie: c });
  assert.equal(store.get(id).reports.length, 1);
  for (let i = 1; i < AUTO_HIDE_REPORTS; i++) {
    await call(`/api/stories/${id}/report`, { method: 'POST', body: { reason: 'other' } });
  }
  assert.equal((await call(`/api/stories/${id}`)).status, 404, 'hidden after enough reports');

  assert.equal((await call('/api/admin/queue')).status, 401);
  const auth = { authorization: `Bearer ${ADMIN}` };
  const queue = await call('/api/admin/queue', { headers: auth });
  assert.ok(queue.body.items.some((s) => s.id === id));
  assert.equal(queue.body.items[0].reports[0].voter, undefined, 'voter ids not exposed');

  await call(`/api/admin/stories/${id}`, { method: 'POST', body: { action: 'restore' }, headers: auth });
  assert.equal((await call(`/api/stories/${id}`)).status, 200);
});

test('posting is rate limited', async () => {
  const s2 = http.createServer(createApp({ store: new Store(null), secret: 's' }));
  await new Promise((r) => s2.listen(0, r));
  const url = `http://127.0.0.1:${s2.address().port}/api/stories`;
  const statuses = [];
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    statuses.push(r.status);
  }
  s2.close();
  assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429]);
});

test('static files and path traversal', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
  const trav = await fetch(`${base}/..%2f..%2fpackage.json`);
  assert.notEqual(trav.status, 200);
  assert.equal((await call('/api/nope')).status, 404);
});
