import type { Grade } from '@/domain/types'

/** The four grade buttons shown after revealing a card. */
export const RATINGS: { grade: Grade; label: string; hint: string }[] = [
  { grade: 1, label: 'Again', hint: 'не вспомнил' },
  { grade: 2, label: 'Hard', hint: 'с трудом' },
  { grade: 3, label: 'Good', hint: 'вспомнил' },
  { grade: 4, label: 'Easy', hint: 'легко' },
]
