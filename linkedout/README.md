# LinkedOut

**The exit interview they never read.** Anonymous, first-hand stories about why people really left their jobs, so the next person can walk in with eyes open.

This is the MVP: a zero-dependency Node app (no `npm install` needed) with a vanilla-JS single-page front end.

## Run it

```bash
cd linkedout
npm run seed          # optional: 7 demo stories about fictional companies
ADMIN_TOKEN=change-me LINKEDOUT_SECRET=$(openssl rand -hex 32) npm start
# → http://localhost:3000
npm test              # 12 tests, node:test
```

Requires Node 20+.

| Env var | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `ADMIN_TOKEN` | Enables the moderation API and `/#/mod` page. Unset = moderation disabled. |
| `LINKEDOUT_SECRET` | HMAC key for anonymous voter ids and delete keys. **Set it in production.** Without it, "I relate" votes and delete keys stop working after a restart. |
| `DATA_FILE` | JSON storage path (default `data/linkedout.json`) |

## Features

- **Share your exit**: company, role, tenure, up to 5 reasons (toxic management, burnout, underpaid, harassment, forced RTO, …), headline, story, advice for the next person, and a 1–5 "would you recommend" rating.
- **Feed**: search, filter by reason, sort by most recent or most relatable.
- **"I relate"**: one toggle per browser.
- **Company pages**: story count, average rating, and a breakdown of why people left. Company names are normalized, so "Acme Inc." and "acme" are grouped together.
- **Delete your own story**: each post returns a private delete key, saved in the browser and shown once so the author can copy it.
- **Moderation**: readers report with a reason. After 3 reports a story is hidden until a moderator restores or removes it.

## Trust & safety by design

A site like this gets its value from candor, and its biggest risks are defamation and doxxing. The MVP builds safeguards in from the start:

- **No accounts and no PII.** There's no name or email field. IPs are only used as HMAC'd keys in an in-memory rate limiter and are never written to disk. Voter ids are random cookies stored only as HMACs.
- **Contact info is redacted automatically** on the server (emails, phone numbers, links, @handles). The form warns the author live before they post.
- **Guidelines are required.** Authors must confirm the story is their own honest experience and doesn't name private individuals. The guidelines push people to describe roles ("my manager"), not names.
- **Harder to unmask.** The public API shows dates to the day, and the UI shows month and year only.
- **Abuse limits**: 5 posts per hour and 120 actions per minute per client, a 32 KB body cap, strict CSP, and user content rendered only via `textContent`.
- Removing a story wipes its text and keeps only a tombstone.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/meta` | reasons, tenures, report reasons, limits |
| GET | `/api/stats` | global counts + top reasons |
| GET | `/api/stories?q=&reason=&company=&sort=recent\|top&offset=&limit=` | feed |
| POST | `/api/stories` | create → `{ story, deleteToken, redactedCount }` |
| GET / DELETE | `/api/stories/:id` | DELETE needs `X-Delete-Token` |
| POST | `/api/stories/:id/relate` | toggle |
| POST | `/api/stories/:id/report` | `{ reason }` |
| GET | `/api/companies?q=` / `/api/companies/:slug` | list / stats |
| GET | `/api/admin/queue` | `Authorization: Bearer $ADMIN_TOKEN` |
| POST | `/api/admin/stories/:id` | `{ action: restore\|hide\|remove }` |

## Layout

```
server.js          HTTP server, routing, rate limiting, security headers
lib/validate.js    schema, limits, PII redaction, company normalization
lib/store.js       JSON-file store (atomic writes), aggregation, moderation
public/            index.html, app.js (SPA), styles.css (light + dark)
scripts/seed.js    demo data (fictional companies)
test/              node:test suites (validation + HTTP API)
```

## Next steps after the MVP

1. Move to Postgres/SQLite with real migrations. The JSON store is single-process only.
2. Require a minimum number of stories before showing a company's aggregate stats, so one person's story isn't singled out.
3. Add optional verified-employee badges via work-email proof, using a hashed domain only and never storing the email.
4. Add ML/LLM pre-moderation that flags personal names and unverifiable accusations before publishing.
5. Write a legal process: terms of service, a takedown/counter-notice flow, and a statutory-agent contact for your jurisdiction.
6. Add a company response channel (verified employer reply, no deletion rights).
