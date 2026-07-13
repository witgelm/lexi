import type { Review, Word } from '@/domain/types'
import { isDue, isNew } from './srs'

export interface StudyItem {
  word: Word
  review: Review
}

/**
 * Builds today's queue: due review cards first, then up to `newLimit`
 * previously-unseen cards. Every word is expected to have a matching review.
 */
export function buildQueue(
  words: Word[],
  reviews: Review[],
  now: Date,
  newLimit: number,
): StudyItem[] {
  const reviewById = new Map(reviews.map((r) => [r.cardId, r]))
  const items: StudyItem[] = []
  for (const word of words) {
    const review = reviewById.get(word.id)
    if (review) items.push({ word, review })
  }

  const dueOld = items.filter((it) => !isNew(it.review) && isDue(it.review, now))
  const fresh = items.filter((it) => isNew(it.review)).slice(0, newLimit)

  // Sort due cards by how overdue they are (most overdue first).
  dueOld.sort((a, b) => a.review.fsrs.due - b.review.fsrs.due)

  return [...dueOld, ...fresh]
}

export interface DeckStats {
  total: number
  due: number
  fresh: number
}

export function deckStats(
  words: Word[],
  reviews: Review[],
  now: Date,
  newLimit: number,
): DeckStats {
  const q = buildQueue(words, reviews, now, newLimit)
  return {
    total: words.length,
    due: q.filter((it) => !isNew(it.review)).length,
    fresh: q.filter((it) => isNew(it.review)).length,
  }
}
