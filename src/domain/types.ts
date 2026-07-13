import type { Card as FsrsCard } from 'ts-fsrs'

/** A deck groups cards; language pair is free-form (universal). */
export interface Deck {
  id: string
  title: string
  /** ISO-ish language code or free label, e.g. "en", "de", "任意" */
  langFrom: string
  langTo: string
  createdAt: number
}

/** The learnable unit: front (prompt) → back (answer). */
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
 * FSRS scheduling state for a word, persisted as a plain object.
 * `due` and `last_review` are stored as epoch millis for JSON safety;
 * conversion to/from ts-fsrs `Card` happens in the SRS service.
 */
export interface Review {
  cardId: string
  fsrs: SerializedFsrsCard
}

/** ts-fsrs Card with Date fields replaced by epoch millis for storage. */
export type SerializedFsrsCard = Omit<FsrsCard, 'due' | 'last_review'> & {
  due: number
  last_review?: number
}

/** Index blob stored under a single CloudStorage key. */
export interface DecksIndex {
  decks: Array<Pick<Deck, 'id' | 'title' | 'langFrom' | 'langTo' | 'createdAt'>>
}
