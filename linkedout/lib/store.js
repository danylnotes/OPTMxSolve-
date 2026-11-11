// Tiny JSON-file store. Good enough for an MVP; swap for Postgres/SQLite later.
// All writes are serialized and written atomically (tmp file + rename).
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { REASONS } from './validate.js';

export const AUTO_HIDE_REPORTS = 3;

export class Store {
  constructor(file) {
    this.file = file;
    this.data = { stories: [] };
    if (file && existsSync(file)) {
      this.data = JSON.parse(readFileSync(file, 'utf8'));
      this.data.stories ??= [];
    }
  }

  #save() {
    if (!this.file) return; // in-memory mode (tests)
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data));
    renameSync(tmp, this.file);
  }

  create(value, { now = Date.now(), deleteTokenHash = null } = {}) {
    const story = {
      id: randomUUID(),
      ...value,
      deleteTokenHash,
      createdAt: new Date(now).toISOString(),
      relates: [], // anonymous voter tokens (hashed)
      reports: [], // { voter, reason, at }
      status: 'visible', // visible | hidden | removed
    };
    this.data.stories.push(story);
    this.#save();
    return story;
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

  /** Author self-delete (proved by the token they got at creation). */
  deleteByAuthor(id, tokenHash) {
    const s = this.get(id);
    if (!s || s.status === 'removed' || !s.deleteTokenHash || s.deleteTokenHash !== tokenHash) return false;
    this.moderate(id, 'remove');
    return true;
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

/** Strip internal fields before sending a story to the public. */
export function toPublic(s, voter) {
  return {
    id: s.id,
    company: s.company,
    companySlug: s.companySlug,
    role: s.role,
    title: s.title,
    story: s.story,
    advice: s.advice,
    tenure: s.tenure,
    rating: s.rating,
    reasons: s.reasons,
    // Day precision only: exact timestamps make it easier to unmask authors.
    createdAt: s.createdAt.slice(0, 10),
    relates: s.relates.length,
    related: voter ? s.relates.includes(voter) : false,
  };
}
