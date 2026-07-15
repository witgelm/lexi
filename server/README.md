# Lexi backend — Cloudflare Worker + D1

API for the Lexi Mini App: Hono router on a Cloudflare Worker, D1 (SQLite) via
Drizzle. Auth is Telegram `initData` (HMAC), no passwords.

## Local dev

```bash
cd server
npm install
printf 'BOT_TOKEN=test-token-123\n' > .dev.vars     # local-only secret
npm run db:generate                                  # regenerate migration after schema edits
npx wrangler d1 migrations apply lexi --local        # apply to local D1
npm run dev                                           # http://localhost:8787
```

Exercise the authenticated API locally:

```bash
INIT=$(node scripts/sign.mjs test-token-123 424242 tester)   # signed initData
curl http://localhost:8787/api/decks -H "Authorization: tma $INIT"
```

## Deploy (Phase 4 — needs your Cloudflare account)

```bash
cd server
npx wrangler login                              # interactive browser auth
npx wrangler d1 create lexi                     # copy the printed database_id
# → paste database_id into wrangler.toml (replace PLACEHOLDER_...)
npx wrangler d1 migrations apply lexi --remote  # create tables on the real D1
npx wrangler secret put BOT_TOKEN               # paste your bot token from @BotFather
npx wrangler deploy                             # prints the Worker URL
```

The Worker URL (e.g. `https://lexi-api.<subdomain>.workers.dev`) becomes the
frontend's `VITE_API_URL` (Phase 5).

## API

All `/api/*` routes require `Authorization: tma <initData>`.

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | liveness (no auth) |
| GET  | `/api/decks` | user's decks + word counts |
| POST | `/api/decks` | create a deck with words (load a preset) |
| GET  | `/api/decks/:id/cards` | words + reviews of a deck |
| DELETE | `/api/decks/:id` | delete a deck |
| POST | `/api/reviews/:wordId/grade` | grade a card (server-side FSRS) |
| GET  | `/api/stats` | aggregate learning stats |

## Schema

`users` · `decks` · `words` · `reviews`. `reviews` stores the full serialized
ts-fsrs card in `fsrs` (source of truth) plus denormalized `due/state/reps/
lapses` columns for indexed queries and stats. See `src/db/schema.ts`.
