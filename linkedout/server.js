// LinkedOut MVP server: zero dependencies, Node >= 20.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store, toPublic } from './lib/store.js';
import { createAnalyzer, heuristicAnalyze } from './lib/analyzer.js';
import { validateStory, REASONS, TENURES, LIMITS, REPORT_REASONS } from './lib/validate.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};
const MAX_BODY = 32 * 1024;

class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

/** Fixed-window in-memory rate limiter keyed by a hashed client id. */
export function rateLimiter({ limit, windowMs }) {
  const hits = new Map();
  return (key, now = Date.now()) => {
    const h = hits.get(key);
    if (!h || now - h.start >= windowMs) {
      hits.set(key, { start: now, n: 1 });
      if (hits.size > 50_000) for (const [k, v] of hits) if (now - v.start >= windowMs) hits.delete(k);
      return true;
    }
    return ++h.n <= limit;
  };
}

export function createApp({
  store,
  analyzer = createAnalyzer(),
  secret = process.env.LINKEDOUT_SECRET || randomBytes(32).toString('hex'),
  adminToken = process.env.ADMIN_TOKEN || '',
  postLimit = rateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 }),
  actionLimit = rateLimiter({ limit: 120, windowMs: 60 * 1000 }),
} = {}) {
  const hash = (v) => createHmac('sha256', secret).update(String(v)).digest('hex').slice(0, 32);

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    });
    res.end(JSON.stringify(body));
  };

  const readJson = (req) =>
    new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY) {
          reject(new HttpError(413, 'Request body too large.'));
          req.destroy();
        } else chunks.push(c);
      });
      req.on('end', () => {
        if (!chunks.length) return resolve({});
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch {
          reject(new HttpError(400, 'Invalid JSON.'));
        }
      });
      req.on('error', reject);
    });

  const cookies = (req) =>
    Object.fromEntries(
      (req.headers.cookie || '')
        .split(';')
        .map((c) => c.trim().split('='))
        .filter(([k, v]) => k && v)
        .map(([k, v]) => [k, decodeURIComponent(v)]),
    );

  /** Anonymous, per-browser voter id. Only its HMAC is ever stored. */
  const voterFor = (req, res) => {
    let raw = cookies(req).lo_v;
    if (!raw || !/^[a-f0-9]{32}$/.test(raw)) {
      raw = randomBytes(16).toString('hex');
      res.setHeader(
        'Set-Cookie',
        `lo_v=${raw}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`,
      );
    }
    return hash(`v:${raw}`);
  };
  const clientKey = (req) => hash(`ip:${req.socket.remoteAddress}`);

  const isAdmin = (req) => {
    if (!adminToken) return false;
    const got = Buffer.from((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    const want = Buffer.from(adminToken);
    return got.length === want.length && timingSafeEqual(got, want);
  };

  const pending = new Set();
  function analyzeInBackground(id, text) {
    const job = analyzer
      .analyze(text)
      .then((a) => store.setAnalysis(id, a))
      .catch((err) => console.error('analysis failed', err))
      .finally(() => pending.delete(job));
    pending.add(job);
    return job;
  }
  /** Resolves when all background analyses have finished (used by tests and backfill). */
  const idle = async () => { while (pending.size) await Promise.all([...pending]); };
  const backfill = () => {
    for (const st of store.data.stories) {
      if (st.status !== 'removed' && st.story && st.analysis?.source !== 'claude' && analyzer.backend === 'claude') analyzeInBackground(st.id, st.story);
      else if (st.status !== 'removed' && st.story && !st.analysis) store.setAnalysis(st.id, heuristicAnalyze(st.story));
    }
  };

  const requireStory = (id) => {
    const s = store.get(id);
    if (!s || s.status !== 'visible') throw new HttpError(404, 'Story not found.');
    return s;
  };

  async function api(req, res, url) {
    const { pathname, searchParams: qs } = url;
    const m = (re) => pathname.match(re);
    const method = req.method;
    let p;

    if (method !== 'GET' && !actionLimit(clientKey(req))) throw new HttpError(429, 'Slow down a little.');

    if (method === 'GET' && pathname === '/api/meta') {
      return send(res, 200, { reasons: REASONS, tenures: TENURES, reportReasons: REPORT_REASONS, limits: LIMITS });
    }

    if (method === 'GET' && pathname === '/api/stats') return send(res, 200, store.globalStats());

    if (method === 'GET' && pathname === '/api/stories') {
      const voter = voterFor(req, res);
      const limit = Math.min(50, Math.max(1, parseInt(qs.get('limit') || '20', 10) || 20));
      const offset = Math.max(0, parseInt(qs.get('offset') || '0', 10) || 0);
      const { total, items } = store.list({
        q: (qs.get('q') || '').slice(0, 100),
        company: qs.get('company') || '',
        reason: qs.get('reason') || '',
        sort: qs.get('sort') === 'top' ? 'top' : 'recent',
        limit,
        offset,
      });
      return send(res, 200, { total, offset, limit, items: items.map((s) => toPublic(s, voter)) });
    }

    if (method === 'POST' && pathname === '/api/stories') {
      if (!postLimit(clientKey(req))) throw new HttpError(429, 'You have posted a lot recently. Try again later.');
      const result = validateStory(await readJson(req));
      if (!result.ok) throw new HttpError(422, 'Please fix the highlighted fields.', { errors: result.errors });
      const deleteToken = randomBytes(18).toString('base64url');
      // Publish immediately with a fast offline analysis, then upgrade it with the
      // model in the background so posting never waits on an API call.
      const story = store.create(result.value, {
        deleteTokenHash: hash(`d:${deleteToken}`),
        analysis: heuristicAnalyze(result.value.story),
      });
      analyzeInBackground(story.id, result.value.story);
      return send(res, 201, {
        story: toPublic(story, voterFor(req, res)),
        deleteToken,
        redactedCount: result.redactedCount,
      });
    }

    if ((p = m(/^\/api\/stories\/([\w-]+)$/))) {
      if (method === 'GET') return send(res, 200, { story: toPublic(requireStory(p[1]), voterFor(req, res)) });
      if (method === 'DELETE') {
        const token = req.headers['x-delete-token'] || '';
        if (!store.deleteByAuthor(p[1], hash(`d:${token}`))) throw new HttpError(403, 'Invalid delete token.');
        return send(res, 200, { ok: true });
      }
    }

    if (method === 'POST' && (p = m(/^\/api\/stories\/([\w-]+)\/relate$/))) {
      requireStory(p[1]);
      return send(res, 200, store.toggleRelate(p[1], voterFor(req, res)));
    }

    if (method === 'POST' && (p = m(/^\/api\/stories\/([\w-]+)\/report$/))) {
      requireStory(p[1]);
      const { reason } = await readJson(req);
      if (!(reason in REPORT_REASONS)) throw new HttpError(422, 'Pick a report reason.');
      store.report(p[1], voterFor(req, res), reason);
      return send(res, 200, { ok: true });
    }

    if (method === 'GET' && pathname === '/api/companies') {
      return send(res, 200, { items: store.companies({ q: (qs.get('q') || '').slice(0, 100) }) });
    }

    if (method === 'GET' && (p = m(/^\/api\/companies\/([a-z0-9-]+)$/))) {
      const stats = store.companyStats(p[1]);
      if (!stats) throw new HttpError(404, 'No stories for this company yet.');
      return send(res, 200, { ...stats, similar: store.similarFirms(p[1]) });
    }

    if (method === 'GET' && pathname === '/api/patterns') return send(res, 200, { items: store.patterns() });

    // --- moderation ---
    if (pathname.startsWith('/api/admin/')) {
      if (!isAdmin(req)) throw new HttpError(401, 'Admin token required.');
      if (method === 'GET' && pathname === '/api/admin/queue') {
        return send(res, 200, {
          items: store.moderationQueue().map((s) => ({
            ...toPublic(s),
            status: s.status,
            reports: s.reports.map(({ reason, at }) => ({ reason, at })),
          })),
        });
      }
      if (method === 'POST' && (p = m(/^\/api\/admin\/stories\/([\w-]+)$/))) {
        const { action } = await readJson(req);
        const s = store.moderate(p[1], action);
        if (!s) throw new HttpError(400, 'Unknown story or action (restore|hide|remove).');
        return send(res, 200, { id: s.id, status: s.status });
      }
    }

    throw new HttpError(404, 'Not found.');
  }

  async function serveStatic(req, res, pathname) {
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed.');
    let rel = pathname === '/' ? '/index.html' : pathname;
    if (!extname(rel)) rel = '/index.html'; // SPA routes
    const file = normalize(join(PUBLIC_DIR, rel));
    if (!file.startsWith(PUBLIC_DIR)) throw new HttpError(403, 'Forbidden.');
    let body;
    try {
      body = await readFile(file);
    } catch {
      throw new HttpError(404, 'Not found.');
    }
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  }

  async function handler(req, res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; style-src 'self'; frame-ancestors 'none'",
    );
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) await api(req, res, url);
      else await serveStatic(req, res, url.pathname);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      if (!res.headersSent) send(res, status, { error: status === 500 ? 'Server error.' : err.message, ...err.extra });
    }
  }
  return Object.assign(handler, { idle, backfill });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  const store = new Store(process.env.DATA_FILE || join(ROOT, 'data', 'linkedout.json'));
  if (!process.env.ADMIN_TOKEN) console.warn('ADMIN_TOKEN not set: moderation API is disabled.');
  if (!process.env.LINKEDOUT_SECRET) console.warn('LINKEDOUT_SECRET not set: using a random secret (votes/delete tokens reset on restart).');
  const app = createApp({ store });
  app.backfill();
  console.log(`Post analysis: ${process.env.ANTHROPIC_API_KEY ? 'Claude' : 'keyword heuristic (set ANTHROPIC_API_KEY for Claude)'}`);
  http.createServer(app).listen(port, () => console.log(`LinkedOut running on http://localhost:${port}`));
}
