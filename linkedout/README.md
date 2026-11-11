# LinkedOut

**The exit interview they never read.** Pseudonymous, first-hand stories about why people really left their jobs, so the next person can walk in with eyes open.

This is the MVP: a zero-dependency Node app (no `npm install` needed) with a vanilla-JS single-page front end.

## Run it

```bash
cd linkedout
npm run seed          # optional: 7 demo stories about fictional companies
ADMIN_TOKEN=change-me LINKEDOUT_SECRET=$(openssl rand -hex 32) npm start
# → http://localhost:3000
npm test              # 25 tests, node:test
```

Requires Node 20+.

| Env var | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `ADMIN_TOKEN` | Enables the moderation API and `/#/mod` page. Unset = moderation disabled. |
| `LINKEDOUT_SECRET` | HMAC key used to hash client IPs for rate limiting. Optional: a random one is generated if unset. |
| `COOKIE_SECURE` | Set to `1` to add the `Secure` flag to the session cookie (also automatic behind `X-Forwarded-Proto: https`). Set it in production. |
| `ANTHROPIC_API_KEY` | Turns on Claude post analysis. Without it the keyword heuristic is used. |
| `ANALYSIS_MODEL` | Model used for analysis (default `claude-opus-5-5`; a cheaper model is fine for bulk classification) |
| `DATA_FILE` | JSON storage path (default `data/linkedout.json`) |

## Accounts

Pseudonymous: **username + password, no email, no real name.**

- Reading is public. Posting, "I relate" and reporting need an account (so votes and reports are one per person).
- Posts show `@username` and link to a profile page listing that user's public posts.
- Each post has a **"Hide my username"** option. It stays out of the feed and the profile, but the author can still delete it, and moderators can still see the account.
- Passwords are hashed with scrypt. Sessions are random 256-bit tokens in an `HttpOnly; SameSite=Lax` cookie, and only a SHA-256 of the token is stored.
- Sign-up is limited to 5 per hour per client, login to 10 per 15 minutes per client+username, and posting to 5 per hour per account. Login errors don't reveal whether a username exists.
- Moderators can **ban an account**, which ends its sessions, blocks login and hides its posts.
- There is no email, so a forgotten password can't be reset. The sign-up screen says so.

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

Other features: search and theme filters, "I relate" votes, deleting your own posts, and community reports with auto-hide plus a moderation queue.

## Trust & safety by design

A site like this gets its value from candor, and its biggest risks are defamation and doxxing. The MVP builds safeguards in from the start:

- **Minimal personal data.** No name or email field anywhere. IPs are only used as HMAC'd keys in an in-memory rate limiter and are never written to disk. Passwords are scrypt-hashed.
- **Contact info is redacted automatically** on the server (emails, phone numbers, links, @handles). The form warns the author live before they post.
- **Guidelines are required.** Authors must confirm the story is their own honest experience and doesn't name private individuals. The guidelines push people to describe roles ("my manager"), not names.
- **Harder to unmask.** The public API shows dates to the day, and the UI shows month and year only. Posts can hide the username.
- **Abuse limits**: 5 posts per hour per account, 120 actions per minute per client, a 32 KB body cap, strict CSP, and user content rendered only via `textContent`.
- Removing a story wipes its text and keeps only a tombstone.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/meta` | reasons, tenures, report reasons, limits |
| GET | `/api/stats` | global counts + top reasons |
| POST | `/api/auth/register` / `login` / `logout` | `{ username, password }` → sets session cookie |
| GET | `/api/auth/me` | `{ user: { username } \| null }` |
| GET | `/api/users/:username` | profile + that user's public posts |
| GET | `/api/stories?q=&reason=&company=&sort=recent\|top&offset=&limit=` | feed |
| POST | `/api/stories` | **login**. `{ company, role?, story, anonymous?, agree }` → `{ story, redactedCount }` |
| GET / DELETE | `/api/stories/:id` | DELETE: **login**, owner only |
| POST | `/api/stories/:id/relate` | **login**, toggle |
| POST | `/api/stories/:id/report` | **login**, `{ reason }` |
| GET | `/api/companies?q=` / `/api/companies/:slug` | list / stats + `similar` firms |
| GET | `/api/patterns` | themes that recur across 2+ firms |
| GET | `/api/admin/queue` | `Authorization: Bearer $ADMIN_TOKEN` (includes post author account) |
| POST | `/api/admin/stories/:id` | `{ action: restore\|hide\|remove }` |
| POST | `/api/admin/users/:username/ban` | ends sessions, blocks login, hides posts |

## Layout

```
server.js          HTTP server, routing, rate limiting, security headers
lib/analyzer.js    Claude + heuristic post analysis (themes, sentiment, headline)
lib/auth.js        usernames, scrypt passwords, session tokens
lib/validate.js    schema, limits, PII redaction, company normalization
lib/store.js       JSON-file store (atomic writes), aggregation, moderation
public/            index.html, app.js (SPA), styles.css (light + dark)
scripts/seed.js    demo data (fictional companies)
test/              node:test suites (validation + HTTP API)
```

## Next steps after the MVP

1. Move to Postgres/SQLite with real migrations. The JSON store is single-process only.
2. Require a minimum number of stories before showing a company's aggregate stats, so one person's story isn't singled out.
3. Add optional verified-employee badges via work-email proof, using a hashed domain only and never storing the email. This could also double as an optional account-recovery path.
   Also consider new-account throttling on reports so sybil accounts can't mass-hide posts.
4. Reuse the analyzer for pre-moderation: flag personal names and unverifiable accusations before publishing.
   Also have Claude write a short plain-English summary per company from its posts, and cluster firms with embeddings instead of fixed themes.
5. Write a legal process: terms of service, a takedown/counter-notice flow, and a statutory-agent contact for your jurisdiction.
6. Add a company response channel (verified employer reply, no deletion rights).
