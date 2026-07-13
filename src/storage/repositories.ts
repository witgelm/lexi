import { cloud } from './cloudStorage'
import { loadCollection, saveCollection } from './chunked'
import type { Deck, DecksIndex, Review, Word } from '@/domain/types'

// Telegram CloudStorage keys may only contain [A-Za-z0-9_-] — no colons.
const K_DECKS = 'idx'
const wordsNs = (deckId: string) => `d_${deckId}_w`
const reviewsNs = (deckId: string) => `d_${deckId}_r`

/** Simple id generator (no crypto dependency needed for local ids). */
export function genId(): string {
  return Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36)
}

export const decksRepo = {
  async list(): Promise<Deck[]> {
    const idx = await cloud.getJSON<DecksIndex>(K_DECKS, { decks: [] })
    return idx.decks.map((d) => ({ ...d }))
  },

  async save(deck: Deck): Promise<void> {
    const idx = await cloud.getJSON<DecksIndex>(K_DECKS, { decks: [] })
    const entry = {
      id: deck.id,
      title: deck.title,
      langFrom: deck.langFrom,
      langTo: deck.langTo,
      createdAt: deck.createdAt,
    }
    const i = idx.decks.findIndex((d) => d.id === deck.id)
    if (i >= 0) idx.decks[i] = entry
    else idx.decks.push(entry)
    await cloud.setJSON(K_DECKS, idx)
  },

  async remove(deckId: string): Promise<void> {
    const idx = await cloud.getJSON<DecksIndex>(K_DECKS, { decks: [] })
    idx.decks = idx.decks.filter((d) => d.id !== deckId)
    await cloud.setJSON(K_DECKS, idx)
    await saveCollection<Word>(wordsNs(deckId), [])
    await saveCollection<Review>(reviewsNs(deckId), [])
  },
}

export const wordsRepo = {
  list(deckId: string): Promise<Word[]> {
    return loadCollection<Word>(wordsNs(deckId))
  },

  async addMany(deckId: string, words: Word[]): Promise<void> {
    const existing = await loadCollection<Word>(wordsNs(deckId))
    await saveCollection<Word>(wordsNs(deckId), [...existing, ...words])
  },

  async saveAll(deckId: string, words: Word[]): Promise<void> {
    await saveCollection<Word>(wordsNs(deckId), words)
  },
}

export const reviewsRepo = {
  list(deckId: string): Promise<Review[]> {
    return loadCollection<Review>(reviewsNs(deckId))
  },

  async saveAll(deckId: string, reviews: Review[]): Promise<void> {
    await saveCollection<Review>(reviewsNs(deckId), reviews)
  },
}
