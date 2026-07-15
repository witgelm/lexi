import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

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

/**
 * FSRS scheduling state, one row per word. `fsrs` holds the full serialized
 * ts-fsrs Card (source of truth for scheduling — robust across ts-fsrs
 * versions). The other columns are denormalized copies for fast/queryable
 * filtering and stats. Dates are epoch millis.
 */
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
    state: integer('state').notNull(), // 0=New,1=Learning,2=Review,3=Relearning
    reps: integer('reps').notNull(),
    lapses: integer('lapses').notNull(),
    lastReview: integer('last_review'),
    fsrs: text('fsrs').notNull(), // full serialized ts-fsrs Card (JSON)
  },
  (t) => [
    index('reviews_user_due_idx').on(t.userId, t.due),
    index('reviews_user_state_idx').on(t.userId, t.state),
  ],
)
