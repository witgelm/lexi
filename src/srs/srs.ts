import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs'
import type { Review, SerializedFsrsCard } from '@/domain/types'

/** Single scheduler instance with sensible defaults; retention ~0.9. */
const scheduler = fsrs(generatorParameters({ enable_fuzz: true }))

export const RATINGS: { grade: Grade; label: string; hint: string }[] = [
  { grade: Rating.Again, label: 'Again', hint: 'не вспомнил' },
  { grade: Rating.Hard, label: 'Hard', hint: 'с трудом' },
  { grade: Rating.Good, label: 'Good', hint: 'вспомнил' },
  { grade: Rating.Easy, label: 'Easy', hint: 'легко' },
]

function serialize(card: FsrsCard): SerializedFsrsCard {
  return {
    ...card,
    due: card.due.getTime(),
    last_review: card.last_review ? card.last_review.getTime() : undefined,
  }
}

function deserialize(s: SerializedFsrsCard): FsrsCard {
  return {
    ...s,
    due: new Date(s.due),
    last_review: s.last_review != null ? new Date(s.last_review) : undefined,
  }
}

/** A fresh review for a brand-new card, due immediately. */
export function newReview(cardId: string, now: Date): Review {
  return { cardId, fsrs: serialize(createEmptyCard(now)) }
}

/** Apply a grade and return the updated review with a new schedule. */
export function grade(review: Review, g: Grade, now: Date): Review {
  const card = deserialize(review.fsrs)
  const next = scheduler.next(card, now, g)
  return { cardId: review.cardId, fsrs: serialize(next.card) }
}

/** True if the card is due at or before `now`. */
export function isDue(review: Review, now: Date): boolean {
  return review.fsrs.due <= now.getTime()
}

/** New = card has never been reviewed (reps === 0). */
export function isNew(review: Review): boolean {
  return review.fsrs.reps === 0
}
