// Tiny JSON-file store. Good enough for an MVP; swap for Postgres/SQLite later.
// All writes are serialized and written atomically (tmp file + rename).
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { REASONS } from './validate.js';
import { usernameKey } from './auth.js';

export const AUTO_HIDE_REPORTS = 3;

export class Store {
  constructor(file) {
    this.file = file;
    this.data = { stories: [], users: [], sessions: {} };
    if (file && existsSync(file)) {
      this.data = JSON.parse(readFileSync(file, 'utf8'));
      this.data.stories ??= [];
      this.data.users ??= [];
      this.data.sessions ??= {};
    }
  }

  #save() {
    if (!this.file) return; // in-memory mode (tests)
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data));
    renameSync(tmp, this.file);
  }

  create(value, { now = Date.now(), userId = null, anonymous = false, analysis = null } = {}) {
    const story = {
      id: randomUUID(),
      title: '',
      advice: '',
      rating: 3,
      reasons: [],
      ...value,
      userId, // account that owns the post (null for legacy posts)
      anonymous: Boolean(anonymous), // hide the username publicly
      createdAt: new Date(now).toISOString(),
      relates: [], // ids of users who relate
      reports: [], // { voter, reason, at }
      status: 'visible', // visible | hidden | removed
    };
    this.data.stories.push(story);
    if (analysis) this.setAnalysis(story.id, analysis);
    else this.#save();
    return story;
  }

  /**
   * Attach AI analysis. Themes, sentiment and headline are derived from the post
   * and feed every aggregate (company pages, patterns, similar firms).
   */
  setAnalysis(id, analysis) {
    const s = this.get(id);
    if (!s || s.status === 'removed') return null;
    s.analysis = { ...analysis, analyzedAt: new Date().toISOString() };
    s.reasons = analysis.themes;
    s.rating = analysis.sentiment;
    s.title = analysis.headline;
    this.#save();
    return s;
  }

  get(id) {
    return this.data.stories.find((s) => s.id === id) ?? null;
  }

  list({ q = '', company = '', reason = '', sort = 'recent', limit = 20, offset = 0, includeHidden = false } = {}) {
    const needle = q.trim().toLowerCase();
    let rows = this.data.stories.filter((s) => (includeHidden ? s.status !== 'removed' : s.status === 'visible'));
    if (company) rows = rows.filter((s) => s.companySlug === company);
    if (reason) rows = rows.filter((s) => s.reasons.includes(reason));
    if (needle) {
      rows = rows.filter((s) =>
        [s.company, s.role, s.title, s.story, s.advice].some((f) => f && f.toLowerCase().includes(needle)),
      );
    }
    rows.sort(
      sort === 'top'
        ? (a, b) => b.relates.length - a.relates.length || b.createdAt.localeCompare(a.createdAt)
        : (a, b) => b.createdAt.localeCompare(a.createdAt),
    );
    return { total: rows.length, items: rows.slice(offset, offset + limit) };
  }

  /** Toggle "I relate" for a voter. Returns new count. */
  toggleRelate(id, voter) {
    const s = this.get(id);
    if (!s || s.status !== 'visible') return null;
    const i = s.relates.indexOf(voter);
    if (i === -1) s.relates.push(voter);
    else s.relates.splice(i, 1);
    this.#save();
    return { count: s.relates.length, related: i === -1 };
  }

  report(id, voter, reason) {
    const s = this.get(id);
    if (!s || s.status === 'removed') return null;
    if (!s.reports.some((r) => r.voter === voter)) {
      s.reports.push({ voter, reason, at: new Date().toISOString() });
      if (s.status === 'visible' && s.reports.length >= AUTO_HIDE_REPORTS) s.status = 'hidden';
      this.#save();
    }
    return { reports: s.reports.length, status: s.status };
  }

  moderate(id, action) {
    const s = this.get(id);
    if (!s) return null;
    if (action === 'restore') {
      s.status = 'visible';
      s.reports = [];
    } else if (action === 'remove') {
      s.status = 'removed';
      // Drop the content entirely; keep a tombstone for audit.
      for (const k of ['role', 'title', 'story', 'advice']) s[k] = '';
    } else if (action === 'hide') {
      s.status = 'hidden';
    } else return null;
    this.#save();
    return s;
  }

  /** Owner self-delete. */
  deleteByAuthor(id, userId) {
    const s = this.get(id);
    if (!s || s.status === 'removed' || !userId || s.userId !== userId) return false;
    this.moderate(id, 'remove');
    return true;
  }

  // ---- accounts ----
  createUser({ username, passHash }, { now = Date.now() } = {}) {
    if (this.userByName(username)) return null;
    const user = { id: randomUUID(), username, usernameKey: usernameKey(username), passHash, createdAt: new Date(now).toISOString(), banned: false };
    this.data.users.push(user);
    this.#save();
    return user;
  }

  userByName(name) {
    const k = usernameKey(name);
    return this.data.users.find((u) => u.usernameKey === k) ?? null;
  }

  userById(id) {
    return this.data.users.find((u) => u.id === id) ?? null;
  }

  createSession(userId, tokenHash, { now = Date.now(), ttlMs = 30 * 24 * 3600 * 1000 } = {}) {
    for (const [h, v] of Object.entries(this.data.sessions)) if (v.expiresAt <= now) delete this.data.sessions[h];
    this.data.sessions[tokenHash] = { userId, expiresAt: now + ttlMs };
    this.#save();
  }

  /** The (non-banned) user for a session token hash, or null. */
  sessionUser(tokenHash, { now = Date.now() } = {}) {
    const sess = this.data.sessions[tokenHash];
    if (!sess) return null;
    if (sess.expiresAt <= now) return null;
    const u = this.userById(sess.userId);
    return u && !u.banned ? u : null;
  }

  deleteSession(tokenHash) {
    if (this.data.sessions[tokenHash]) {
      delete this.data.sessions[tokenHash];
      this.#save();
    }
  }

  /** Ban an account: ends its sessions and hides everything it posted. */
  banUser(username) {
    const u = this.userByName(username);
    if (!u) return null;
    u.banned = true;
    for (const [h, v] of Object.entries(this.data.sessions)) if (v.userId === u.id) delete this.data.sessions[h];
    let hidden = 0;
    for (const st of this.data.stories) {
      if (st.userId === u.id && st.status === 'visible') { st.status = 'hidden'; hidden++; }
    }
    this.#save();
    return { username: u.username, hidden };
  }

  /** Public, non-anonymous posts by one user (for profile pages). */
  userStories(userId, { limit = 50 } = {}) {
    return this.data.stories
      .filter((s) => s.userId === userId && s.status === 'visible' && !s.anonymous)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Shape a story for the public. `viewerId` (the logged-in user, if any) decides
   * `related` and `mine`. The author's username is only exposed on non-anonymous posts.
   */
  present(s, viewerId = null) {
    const author = s.userId && !s.anonymous ? this.userById(s.userId)?.username ?? null : null;
    return {
      id: s.id,
      author,
      mine: Boolean(viewerId && s.userId === viewerId),
      company: s.company,
      companySlug: s.companySlug,
      role: s.role,
      title: s.title,
      story: s.story,
      advice: s.advice,
      tenure: s.tenure,
      rating: s.rating,
      reasons: s.reasons,
      aiSource: s.analysis?.source ?? null,
      // Day precision only: exact timestamps make it easier to link posts together.
      createdAt: s.createdAt.slice(0, 10),
      relates: s.relates.length,
      related: viewerId ? s.relates.includes(viewerId) : false,
    };
  }

  moderationQueue() {
    return this.data.stories
      .filter((s) => s.status === 'hidden' || (s.status === 'visible' && s.reports.length > 0))
      .sort((a, b) => b.reports.length - a.reports.length);
  }

  companies({ q = '', limit = 50 } = {}) {
    const map = new Map();
    for (const s of this.data.stories) {
      if (s.status !== 'visible') continue;
      const c = map.get(s.companySlug) ?? { slug: s.companySlug, names: new Map(), count: 0, ratingSum: 0 };
      c.count++;
      c.ratingSum += s.rating;
      c.names.set(s.company, (c.names.get(s.company) ?? 0) + 1);
      map.set(s.companySlug, c);
    }
    const needle = q.trim().toLowerCase();
    return [...map.values()]
      .map((c) => ({
        slug: c.slug,
        name: [...c.names.entries()].sort((a, b) => b[1] - a[1])[0][0],
        count: c.count,
        avgRating: Math.round((c.ratingSum / c.count) * 10) / 10,
      }))
      .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.slug.includes(needle))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, limit);
  }

  companyStats(slug) {
    const rows = this.data.stories.filter((s) => s.status === 'visible' && s.companySlug === slug);
    if (!rows.length) return null;
    const reasonCounts = Object.fromEntries(Object.keys(REASONS).map((k) => [k, 0]));
    const names = new Map();
    let ratingSum = 0;
    for (const s of rows) {
      ratingSum += s.rating;
      names.set(s.company, (names.get(s.company) ?? 0) + 1);
      for (const r of s.reasons) reasonCounts[r]++;
    }
    const topReasons = Object.entries(reasonCounts)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([key, n]) => ({ key, label: REASONS[key], count: n, pct: Math.round((n / rows.length) * 100) }));
    return {
      slug,
      name: [...names.entries()].sort((a, b) => b[1] - a[1])[0][0],
      count: rows.length,
      avgRating: Math.round((ratingSum / rows.length) * 10) / 10,
      topReasons,
    };
  }

  /** Share of a company's posts mentioning each theme, as a sparse {theme: 0..1} vector. */
  #themeVectors() {
    const by = new Map();
    for (const s of this.data.stories) {
      if (s.status !== 'visible') continue;
      const c = by.get(s.companySlug) ?? { n: 0, counts: {}, names: new Map() };
      c.n++;
      c.names.set(s.company, (c.names.get(s.company) ?? 0) + 1);
      for (const r of s.reasons) c.counts[r] = (c.counts[r] ?? 0) + 1;
      by.set(s.companySlug, c);
    }
    return [...by.entries()].map(([slug, c]) => ({
      slug,
      n: c.n,
      name: [...c.names.entries()].sort((a, b) => b[1] - a[1])[0][0],
      vec: Object.fromEntries(Object.entries(c.counts).map(([k, v]) => [k, v / c.n])),
    }));
  }

  /** Firms whose reasons-for-leaving profile looks like this one (cosine similarity). */
  similarFirms(slug, { limit = 3, min = 0.5 } = {}) {
    const all = this.#themeVectors();
    const me = all.find((c) => c.slug === slug);
    if (!me || !Object.keys(me.vec).length) return [];
    const norm = (v) => Math.sqrt(Object.values(v).reduce((a, x) => a + x * x, 0));
    const dot = (a, b) => Object.keys(a).reduce((t, k) => t + a[k] * (b[k] ?? 0), 0);
    return all
      .filter((c) => c.slug !== slug && Object.keys(c.vec).length)
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        count: c.n,
        similarity: dot(me.vec, c.vec) / (norm(me.vec) * norm(c.vec)),
        shared: Object.keys(me.vec)
          .filter((k) => c.vec[k])
          .sort((a, b) => me.vec[b] + c.vec[b] - (me.vec[a] + c.vec[a]))
          .slice(0, 3)
          .map((k) => REASONS[k]),
      }))
      .filter((c) => c.similarity >= min)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((c) => ({ ...c, similarity: Math.round(c.similarity * 100) / 100 }));
  }

  /** For each theme, the firms where it shows up in at least `minShare` (a third) of posts. Only themes with 2+ firms. */
  patterns({ minShare = 0.33 } = {}) {
    const all = this.#themeVectors();
    return Object.keys(REASONS)
      .map((key) => ({
        key,
        label: REASONS[key],
        firms: all
          .filter((c) => (c.vec[key] ?? 0) >= minShare)
          .sort((a, b) => b.vec[key] - a.vec[key] || b.n - a.n)
          .map((c) => ({ slug: c.slug, name: c.name, count: c.n, pct: Math.round(c.vec[key] * 100) })),
      }))
      .filter((p) => p.firms.length >= 2)
      .sort((a, b) => b.firms.length - a.firms.length);
  }

  globalStats() {
    const visible = this.data.stories.filter((s) => s.status === 'visible');
    const counts = {};
    for (const s of visible) for (const r of s.reasons) counts[r] = (counts[r] ?? 0) + 1;
    return {
      stories: visible.length,
      companies: new Set(visible.map((s) => s.companySlug)).size,
      topReasons: Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, count]) => ({ key, label: REASONS[key], count })),
    };
  }
}
