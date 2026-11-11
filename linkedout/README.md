# LinkedOut

**The exit interview they never read.** Anonymous, first-hand stories about why people really left their jobs, so the next person can walk in with eyes open.

This is the MVP: a zero-dependency Node app (no `npm install` needed) with a vanilla-JS single-page front end.

## Run it

```bash
cd linkedout
npm run seed          # optional: 7 demo stories about fictional companies
ADMIN_TOKEN=change-me LINKEDOUT_SECRET=$(openssl rand -hex 32) npm start
# → http://localhost:3000
npm test              # 18 tests, node:test
```

Requires Node 20+.

| Env var | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `ADMIN_TOKEN` | Enables the moderation API and `/#/mod` page. Unset = moderation disabled. |
| `LINKEDOUT_SECRET` | HMAC key for anonymous voter ids and delete keys. **Set it in production.** Without it, "I relate" votes and delete keys stop working after a restart. |
| `ANTHROPIC_API_KEY` | Turns on Claude post analysis. Without it the keyword heuristic is used. |
| `ANALYSIS_MODEL` | Model used for analysis (default `claude-opus-5-5`; a cheaper model is fine for bulk classification) |
| `DATA_FILE` | JSON storage path (default `data/linkedout.json`) |

## How it works

People post like they would on LinkedIn: a company and free text, nothing else to fill in. **AI reads each post** and derives the structure:

- **Themes** (burnout, toxic management, broken promises, forced RTO, …), a 1–5 **sentiment**, and a neutral one-line **headline**.
- **Company pages** aggregate those themes across every post ("Why people left: 67% toxic management…").
- **Firms with a similar pattern**: companies are compared by their theme profile (cosine similarity).
- **Patterns across firms**: for each theme, which companies it keeps coming up at.

Posting is instant. A fast keyword heuristic runs first, then Claude re-analyzes in the background and replaces it.

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start     # Claude analysis (default model claude-opus-5-5, override with ANALYSIS_MODEL)
npm start                                  # no key: keyword heuristic only, everything still works
```

Claude is called with the official SDK, a JSON schema constrained to the theme list, and `effort: low`. Post text is passed as untrusted data (`<post>` delimiters plus a system rule), so a post can't instruct the classifier. The server-side refusal fallback is enabled. Any API error or malformed reply falls back to the heuristic. Only text that has already been scrubbed of emails, phones, links and handles is sent to the model.

Other features: search and theme filters, "I relate" votes, delete-your-own-post via a private key, and community reports with auto-hide plus a moderation queue.

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
| POST | `/api/stories` | `{ company, role?, story, agree }` → `{ story, deleteToken, redactedCount }` |
| GET / DELETE | `/api/stories/:id` | DELETE needs `X-Delete-Token` |
| POST | `/api/stories/:id/relate` | toggle |
| POST | `/api/stories/:id/report` | `{ reason }` |
| GET | `/api/companies?q=` / `/api/companies/:slug` | list / stats + `similar` firms |
| GET | `/api/patterns` | themes that recur across 2+ firms |
| GET | `/api/admin/queue` | `Authorization: Bearer $ADMIN_TOKEN` |
| POST | `/api/admin/stories/:id` | `{ action: restore\|hide\|remove }` |

## Layout

```
server.js          HTTP server, routing, rate limiting, security headers
lib/analyzer.js    Claude + heuristic post analysis (themes, sentiment, headline)
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
4. Reuse the analyzer for pre-moderation: flag personal names and unverifiable accusations before publishing.
   Also have Claude write a short plain-English summary per company from its posts, and cluster firms with embeddings instead of fixed themes.
5. Write a legal process: terms of service, a takedown/counter-notice flow, and a statutory-agent contact for your jurisdiction.
6. Add a company response channel (verified employer reply, no deletion rights).
