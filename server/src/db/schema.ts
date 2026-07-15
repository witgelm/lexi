import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

/** A Telegram user, keyed by their telegram_id. */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  telegramId: text('telegram_id').notNull().unique(),
  username: text('username'),
  createdAt: integer('created_at').notNull(),
})

/** A deck (dictionary) owned by a user. */
export const decks = sqliteTable(
  'decks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    langFrom: text('lang_from').notNull(),
    langTo: text('lang_to').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('decks_user_idx').on(t.userId)],
)

/** A word/card belonging to a deck. */
export const words = sqliteTable(
  'words',
  {
    id: text('id').primaryKey(),
    deckId: text('deck_id')
      .notNull()
      .references(() => decks.id, { onDelete: 'cascade' }),
    front: text('front').notNull(),
    back: text('back').notNull(),
    transcription: text('transcription'),
    example: text('example'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('words_deck_idx').on(t.deckId)],
)

/** FSRS scheduling state, one row per word. Dates stored as epoch millis. */
export const reviews = sqliteTable(
  'reviews',
  {
    wordId: text('word_id')
      .primaryKey()
      .references(() => words.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deckId: text('deck_id')
      .notNull()
      .references(() => decks.id, { onDelete: 'cascade' }),
    due: integer('due').notNull(),
    stability: real('stability').notNull(),
    difficulty: real('difficulty').notNull(),
    elapsedDays: integer('elapsed_days').notNull(),
    scheduledDays: integer('scheduled_days').notNull(),
    reps: integer('reps').notNull(),
    lapses: integer('lapses').notNull(),
    state: integer('state').notNull(),
    lastReview: integer('last_review'),
  },
  (t) => [index('reviews_user_due_idx').on(t.userId, t.due)],
)
