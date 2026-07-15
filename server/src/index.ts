import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema'

export interface Env {
  DB: D1Database
  /** Telegram bot token — set via `wrangler secret put BOT_TOKEN`. */
  BOT_TOKEN: string
}

export const app = new Hono<{ Bindings: Env }>()

// Allow the Mini App (GitHub Pages) and local dev to call the API.
app.use(
  '*',
  cors({
    origin: ['https://witgelm.github.io', 'http://localhost:5173'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  }),
)

app.get('/health', (c) => c.json({ ok: true }))

// Routes (auth, decks, reviews, stats) are added in later phases.

export default app

/** Drizzle handle for a request's D1 binding. */
export const db = (env: Env) => drizzle(env.DB, { schema })
