/** A deck (dictionary). `wordCount` is present in list responses. */
export interface Deck {
  id: string
  title: string
  langFrom: string
  langTo: string
  createdAt: number
  wordCount?: number
}

/** A word/card belonging to a deck. */
export interface Word {
  id: string
  deckId: string
  front: string
  back: string
  transcription?: string
  example?: string
  createdAt: number
}

/**
 * FSRS scheduling state for a word, as the client needs it. The full ts-fsrs
 * card lives only on the server; the client keeps the queryable fields used to
 * build study queues and show progress.
 */
export interface Review {
  wordId: string
  due: number
  state: number
  reps: number
  lapses: number
  lastReview: number | null
}

/** Grade values sent to the server (match ts-fsrs Rating). */
export type Grade = 1 | 2 | 3 | 4
