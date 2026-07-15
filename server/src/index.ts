import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq, gte, sql } from 'drizzle-orm'
import type { Grade } from 'ts-fsrs'
import * as schema from './db/schema'
import { decks, reviewLog, reviews, users, words } from './db/schema'
import { validateInitData } from './auth'
import { emptyReviewFields, gradeReviewFields } from './fsrs'

export interface Env {
  DB: D1Database
  /** Telegram bot token — set via `wrangler secret put BOT_TOKEN`. */
  BOT_TOKEN: string
}

type User = typeof users.$inferSelect
type Variables = { user: User }

/** Drizzle handle for a request's D1 binding. */
const db = (env: Env) => drizzle(env.DB, { schema })

/** SQLite/D1 caps bound params per statement; insert rows in small batches. */
async function insertInChunks<T>(
  rows: T[],
  size: number,
  run: (batch: T[]) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += size) {
    await run(rows.slice(i, i + size))
  }
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use(
  '*',
  cors({
    origin: ['https://witgelm.github.io', 'http://localhost:5173'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  }),
)

app.get('/health', (c) => c.json({ ok: true }))

// ---- Authenticated API ------------------------------------------------------

const api = new Hono<{ Bindings: Env; Variables: Variables }>()

// Verify Telegram initData (Authorization: "tma <initData>") and load the user.
api.use('*', async (c, next) => {
  const auth = c.req.header('Authorization') ?? ''
  const initData = auth.startsWith('tma ') ? auth.slice(4) : ''
  if (!initData) return c.json({ error: 'unauthorized' }, 401)

  const verified = await validateInitData(initData, c.env.BOT_TOKEN)
  if (!verified) return c.json({ error: 'invalid initData' }, 401)

  const d = db(c.env)
  let user = await d.select().from(users).where(eq(users.telegramId, verified.telegramId)).get()
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      telegramId: verified.telegramId,
      username: verified.username,
      createdAt: Date.now(),
    }
    await d.insert(users).values(user).onConflictDoNothing().run()
    // Re-fetch in case of a concurrent insert race.
    user =
      (await d.select().from(users).where(eq(users.telegramId, verified.telegramId)).get()) ?? user
  }
  c.set('user', user)
  await next()
})

/** List the user's decks with word counts. */
api.get('/decks', async (c) => {
  const user = c.get('user')
  const rows = await db(c.env)
    .select({
      id: decks.id,
      title: decks.title,
      langFrom: decks.langFrom,
      langTo: decks.langTo,
      createdAt: decks.createdAt,
      wordCount: sql<number>`count(${words.id})`,
    })
    .from(decks)
    .leftJoin(words, eq(words.deckId, decks.id))
    .where(eq(decks.userId, user.id))
    .groupBy(decks.id)
    .all()
  return c.json(rows)
})

/** Create a deck with words (used to load a preset dictionary). */
api.post('/decks', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    title: string
    langFrom: string
    langTo: string
    words: Array<{ front: string; back: string; transcription?: string; example?: string }>
  }>()

  const now = Date.now()
  const deckId = crypto.randomUUID()
  const d = db(c.env)

  await d
    .insert(decks)
    .values({
      id: deckId,
      userId: user.id,
      title: body.title,
      langFrom: body.langFrom,
      langTo: body.langTo,
      createdAt: now,
    })
    .run()

  const wordRows = body.words.map((w) => ({
    id: crypto.randomUUID(),
    deckId,
    front: w.front,
    back: w.back,
    transcription: w.transcription ?? null,
    example: w.example ?? null,
    createdAt: now,
  }))
  const reviewRows = wordRows.map((w) => ({
    wordId: w.id,
    userId: user.id,
    deckId,
    ...emptyReviewFields(new Date(now)),
  }))

  await insertInChunks(wordRows, 10, (batch) => d.insert(words).values(batch).run())
  await insertInChunks(reviewRows, 10, (batch) => d.insert(reviews).values(batch).run())

  return c.json({
    id: deckId,
    title: body.title,
    langFrom: body.langFrom,
    langTo: body.langTo,
    createdAt: now,
    wordCount: wordRows.length,
  })
})

/** Words + reviews for one deck (ownership enforced). */
api.get('/decks/:id/cards', async (c) => {
  const user = c.get('user')
  const deckId = c.req.param('id')
  const d = db(c.env)

  const deck = await d
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, user.id)))
    .get()
  if (!deck) return c.json({ error: 'not found' }, 404)

  const [ws, rs] = await Promise.all([
    d.select().from(words).where(eq(words.deckId, deckId)).all(),
    d.select().from(reviews).where(eq(reviews.deckId, deckId)).all(),
  ])
  return c.json({ words: ws, reviews: rs })
})

/** Delete a deck and its words/reviews (ownership enforced). */
api.delete('/decks/:id', async (c) => {
  const user = c.get('user')
  const deckId = c.req.param('id')
  const d = db(c.env)

  const deck = await d
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, user.id)))
    .get()
  if (!deck) return c.json({ error: 'not found' }, 404)

  await d.delete(reviewLog).where(eq(reviewLog.deckId, deckId)).run()
  await d.delete(reviews).where(eq(reviews.deckId, deckId)).run()
  await d.delete(words).where(eq(words.deckId, deckId)).run()
  await d.delete(decks).where(eq(decks.id, deckId)).run()
  return c.json({ ok: true })
})

/** Grade a card: recompute FSRS on the server and persist. */
api.post('/reviews/:wordId/grade', async (c) => {
  const user = c.get('user')
  const wordId = c.req.param('wordId')
  const { grade } = await c.req.json<{ grade: Grade }>()
  const d = db(c.env)

  const review = await d
    .select()
    .from(reviews)
    .where(and(eq(reviews.wordId, wordId), eq(reviews.userId, user.id)))
    .get()
  if (!review) return c.json({ error: 'not found' }, 404)

  const now = Date.now()
  const updated = gradeReviewFields(review.fsrs, grade, new Date(now))
  await d.update(reviews).set(updated).where(eq(reviews.wordId, wordId)).run()
  await d
    .insert(reviewLog)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      deckId: review.deckId,
      wordId,
      rating: grade,
      reviewedAt: now,
    })
    .run()
  return c.json({ wordId, ...updated })
})

const DAY = 86_400_000
const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10) // UTC YYYY-MM-DD

/**
 * Rich learning stats for the user: overview, FSRS state breakdown, streak,
 * accuracy, 30-day activity, and a 7-day due forecast. Computed from two
 * queries (current reviews + recent review log) and assembled in JS.
 */
api.get('/stats', async (c) => {
  const user = c.get('user')
  const now = Date.now()
  const d = db(c.env)

  const [revRows, logRows] = await Promise.all([
    d
      .select({
        due: reviews.due,
        state: reviews.state,
        reps: reviews.reps,
        lapses: reviews.lapses,
      })
      .from(reviews)
      .where(eq(reviews.userId, user.id))
      .all(),
    d
      .select({ reviewedAt: reviewLog.reviewedAt, rating: reviewLog.rating })
      .from(reviewLog)
      .where(and(eq(reviewLog.userId, user.id), gte(reviewLog.reviewedAt, now - 180 * DAY)))
      .all(),
  ])

  // Overview + state breakdown + due forecast, from current review rows.
  const overview = { totalWords: revRows.length, fresh: 0, learned: 0, due: 0, lapses: 0 }
  const byState = { new: 0, learning: 0, review: 0, relearning: 0 }
  const forecastMap = new Map<string, number>()
  for (const r of revRows) {
    overview.lapses += r.lapses
    if (r.reps === 0) overview.fresh++
    else {
      overview.learned++
      if (r.due <= now) overview.due++
    }
    if (r.state === 0) byState.new++
    else if (r.state === 1) byState.learning++
    else if (r.state === 2) byState.review++
    else if (r.state === 3) byState.relearning++
    if (r.due > now) forecastMap.set(dayKey(r.due), (forecastMap.get(dayKey(r.due)) ?? 0) + 1)
  }
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const k = dayKey(now + (i + 1) * DAY)
    return { date: k, count: forecastMap.get(k) ?? 0 }
  })

  // Activity / accuracy / streak, from the review log.
  const perDay = new Map<string, { count: number; correct: number }>()
  for (const l of logRows) {
    const k = dayKey(l.reviewedAt)
    const e = perDay.get(k) ?? { count: 0, correct: 0 }
    e.count++
    if (l.rating >= 3) e.correct++
    perDay.set(k, e)
  }
  const activity = Array.from({ length: 30 }, (_, i) => {
    const k = dayKey(now - (29 - i) * DAY)
    return { date: k, count: perDay.get(k)?.count ?? 0 }
  })
  const todayKey = dayKey(now)
  const reviewsToday = perDay.get(todayKey)?.count ?? 0
  const sevenAgo = now - 7 * DAY
  let reviews7d = 0
  let correct = 0
  for (const l of logRows) {
    if (l.reviewedAt >= sevenAgo) reviews7d++
    if (l.rating >= 3) correct++
  }
  const accuracy = logRows.length ? Math.round((correct / logRows.length) * 100) : 0

  // Streak: consecutive days with ≥1 review, ending today (forgiving until
  // end of day — if nothing today yet, count from yesterday).
  let streak = 0
  let cursor = perDay.has(todayKey) ? now : now - DAY
  while (perDay.has(dayKey(cursor))) {
    streak++
    cursor -= DAY
  }

  return c.json({ overview, byState, forecast, activity, reviewsToday, reviews7d, accuracy, streak })
})

app.route('/api', api)

export default app
