import { createEmptyCard, fsrs, generatorParameters, type Card, type Grade } from 'ts-fsrs'

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }))

/** Denormalized review columns + full serialized card, ready for the DB. */
export interface ReviewFields {
  due: number
  state: number
  reps: number
  lapses: number
  lastReview: number | null
  fsrs: string
}

function serialize(card: Card): string {
  return JSON.stringify({
    ...card,
    due: card.due.getTime(),
    last_review: card.last_review ? card.last_review.getTime() : null,
  })
}

function deserialize(json: string): Card {
  const o = JSON.parse(json) as Record<string, unknown> & { due: number; last_review: number | null }
  return {
    ...(o as unknown as Card),
    due: new Date(o.due),
    last_review: o.last_review != null ? new Date(o.last_review) : undefined,
  }
}

function fieldsFrom(card: Card): ReviewFields {
  return {
    due: card.due.getTime(),
    state: card.state,
    reps: card.reps,
    lapses: card.lapses,
    lastReview: card.last_review ? card.last_review.getTime() : null,
    fsrs: serialize(card),
  }
}

/** Fresh review for a new word, due immediately. */
export function emptyReviewFields(now: Date): ReviewFields {
  return fieldsFrom(createEmptyCard(now))
}

/** Apply a grade to a stored card and return the new schedule. */
export function gradeReviewFields(fsrsJson: string, grade: Grade, now: Date): ReviewFields {
  const next = scheduler.next(deserialize(fsrsJson), now, grade)
  return fieldsFrom(next.card)
}
