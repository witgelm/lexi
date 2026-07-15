import type { Review, Word } from '@/domain/types'

export interface StudyItem {
  word: Word
  review: Review
}

/** A single deck's loaded content, used to build cross-deck sessions. */
export interface DeckData {
  words: Word[]
  reviews: Review[]
}

const isNew = (r: Review) => r.reps === 0
const isDue = (r: Review, now: number) => r.due <= now

/** Pairs each word with its review; words without a review are dropped. */
function pair(words: Word[], reviews: Review[]): StudyItem[] {
  const reviewById = new Map(reviews.map((r) => [r.wordId, r]))
  const items: StudyItem[] = []
  for (const word of words) {
    const review = reviewById.get(word.id)
    if (review) items.push({ word, review })
  }
  return items
}

function dueOldest(items: StudyItem[], now: number): StudyItem[] {
  return items
    .filter((it) => !isNew(it.review) && isDue(it.review, now))
    .sort((a, b) => a.review.due - b.review.due)
}

/**
 * Builds today's queue for a single deck: due review cards first (most
 * overdue first), then all previously-unseen cards. No daily new-card cap.
 */
export function buildQueue(words: Word[], reviews: Review[], now: number): StudyItem[] {
  const items = pair(words, reviews)
  const dueOld = dueOldest(items, now)
  const fresh = items.filter((it) => isNew(it.review))
  return [...dueOld, ...fresh]
}

/**
 * Round-robin interleave: takes one item from each list in turn so new words
 * from different decks are mixed rather than grouped deck-by-deck.
 */
function interleave<T>(lists: T[][]): T[] {
  const out: T[] = []
  const maxLen = Math.max(0, ...lists.map((l) => l.length))
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      if (i < list.length) out.push(list[i])
    }
  }
  return out
}

/**
 * Builds a cross-deck session across all decks: every due review card
 * (globally sorted by how overdue it is), then all new cards interleaved
 * round-robin across decks so themes are mixed. No daily new-card cap.
 */
export function buildGlobalQueue(decks: DeckData[], now: number): StudyItem[] {
  const perDeck = decks.map((d) => pair(d.words, d.reviews))
  const dueOld = dueOldest(perDeck.flat(), now)
  const freshByDeck = perDeck.map((items) => items.filter((it) => isNew(it.review)))
  const fresh = interleave(freshByDeck)
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

export function deckStats(words: Word[], reviews: Review[], now: number): DeckStats {
  return statsFromQueue(words.length, buildQueue(words, reviews, now))
}

export function globalStats(decks: DeckData[], now: number): DeckStats {
  const total = decks.reduce((n, d) => n + d.words.length, 0)
  return statsFromQueue(total, buildGlobalQueue(decks, now))
}
