import type { Review, Word } from '@/domain/types'
import { isDue, isNew } from './srs'

export interface StudyItem {
  word: Word
  review: Review
}

/** A single deck's loaded content, used to build cross-deck sessions. */
export interface DeckData {
  words: Word[]
  reviews: Review[]
}

/** Pairs each word with its review; words without a review are dropped. */
function pair(words: Word[], reviews: Review[]): StudyItem[] {
  const reviewById = new Map(reviews.map((r) => [r.cardId, r]))
  const items: StudyItem[] = []
  for (const word of words) {
    const review = reviewById.get(word.id)
    if (review) items.push({ word, review })
  }
  return items
}

function dueOldest(items: StudyItem[], now: Date): StudyItem[] {
  return items
    .filter((it) => !isNew(it.review) && isDue(it.review, now))
    .sort((a, b) => a.review.fsrs.due - b.review.fsrs.due)
}

/**
 * Builds today's queue for a single deck: due review cards first (most
 * overdue first), then up to `newLimit` previously-unseen cards.
 */
export function buildQueue(
  words: Word[],
  reviews: Review[],
  now: Date,
  newLimit: number,
): StudyItem[] {
  const items = pair(words, reviews)
  const dueOld = dueOldest(items, now)
  const fresh = items.filter((it) => isNew(it.review)).slice(0, newLimit)
  return [...dueOld, ...fresh]
}

/**
 * Round-robin interleave: takes one item from each list in turn so new words
 * from different decks are mixed rather than grouped deck-by-deck.
 */
function interleave<T>(lists: T[][], limit: number): T[] {
  const out: T[] = []
  const maxLen = Math.max(0, ...lists.map((l) => l.length))
  for (let i = 0; i < maxLen && out.length < limit; i++) {
    for (const list of lists) {
      if (i < list.length && out.length < limit) out.push(list[i])
    }
  }
  return out
}

/**
 * Builds a cross-deck session across all decks: every due review card
 * (globally sorted by how overdue it is), then up to `newLimit` new cards
 * interleaved round-robin across decks so themes are mixed.
 */
export function buildGlobalQueue(decks: DeckData[], now: Date, newLimit: number): StudyItem[] {
  const perDeck = decks.map((d) => pair(d.words, d.reviews))

  const dueOld = dueOldest(perDeck.flat(), now)

  const freshByDeck = perDeck.map((items) => items.filter((it) => isNew(it.review)))
  const fresh = interleave(freshByDeck, newLimit)

  return [...dueOld, ...fresh]
}

export interface DeckStats {
  total: number
  due: number
  fresh: number
}

function statsFromQueue(total: number, q: StudyItem[]): DeckStats {
  return {
    total,
    due: q.filter((it) => !isNew(it.review)).length,
    fresh: q.filter((it) => isNew(it.review)).length,
  }
}

export function deckStats(
  words: Word[],
  reviews: Review[],
  now: Date,
  newLimit: number,
): DeckStats {
  return statsFromQueue(words.length, buildQueue(words, reviews, now, newLimit))
}

export function globalStats(decks: DeckData[], now: Date, newLimit: number): DeckStats {
  const total = decks.reduce((n, d) => n + d.words.length, 0)
  return statsFromQueue(total, buildGlobalQueue(decks, now, newLimit))
}
