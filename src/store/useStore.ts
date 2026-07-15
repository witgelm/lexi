import { create } from 'zustand'
import type { Deck, Grade, Review, Word } from '@/domain/types'
import type { PresetDeck } from '@/data/greekStarter'
import { api } from '@/api/client'

interface State {
  decks: Deck[]
  loading: boolean
  /** Per-deck loaded words/reviews cache (loaded on demand). */
  words: Record<string, Word[]>
  reviews: Record<string, Review[]>

  loadDecks: () => Promise<void>
  loadDeck: (deckId: string) => Promise<void>
  loadPreset: (preset: PresetDeck) => Promise<Deck>
  deleteDeck: (deckId: string) => Promise<void>
  /** Optimistic: caller advances the UI; the graded review is patched on reply. */
  gradeCard: (deckId: string, wordId: string, g: Grade) => void
  /** Ensures every deck's words/reviews are loaded (for the global session). */
  ensureAllLoaded: () => Promise<void>
}

export const useStore = create<State>((set, get) => ({
  decks: [],
  loading: true,
  words: {},
  reviews: {},

  async loadDecks() {
    set({ loading: true })
    const decks = await api.listDecks()
    set({ decks, loading: false })
  },

  async loadDeck(deckId) {
    const { words, reviews } = await api.getDeckCards(deckId)
    set((s) => ({
      words: { ...s.words, [deckId]: words },
      reviews: { ...s.reviews, [deckId]: reviews },
    }))
  },

  async loadPreset(preset) {
    const deck = await api.createDeck({
      title: preset.title,
      langFrom: preset.langFrom,
      langTo: preset.langTo,
      words: preset.words,
    })
    set((s) => ({ decks: [...s.decks, deck] }))
    await get().loadDeck(deck.id)
    return deck
  },

  async deleteDeck(deckId) {
    await api.deleteDeck(deckId)
    set((s) => {
      const words = { ...s.words }
      const reviews = { ...s.reviews }
      delete words[deckId]
      delete reviews[deckId]
      return { decks: s.decks.filter((d) => d.id !== deckId), words, reviews }
    })
  },

  gradeCard(deckId, wordId, g) {
    // Persist in the background; patch the in-memory review when it returns so
    // stats/queues stay consistent without blocking the UI on the network.
    void api
      .gradeCard(wordId, g)
      .then((updated) => {
        set((s) => {
          const list = s.reviews[deckId]
          if (!list) return {}
          return {
            reviews: {
              ...s.reviews,
              [deckId]: list.map((r) => (r.wordId === wordId ? updated : r)),
            },
          }
        })
      })
      .catch(() => {
        /* best-effort; next session reload reconciles from the server */
      })
  },

  async ensureAllLoaded() {
    const { decks, words } = get()
    await Promise.all(
      decks.filter((d) => words[d.id] == null).map((d) => get().loadDeck(d.id)),
    )
  },
}))
