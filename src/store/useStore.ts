import { create } from 'zustand'
import type { Deck, Review, Word } from '@/domain/types'
import type { PresetDeck } from '@/data/greekStarter'
import { decksRepo, genId, reviewsRepo, settingsRepo, wordsRepo } from '@/storage/repositories'
import { grade as gradeReview, newReview } from '@/srs/srs'
import type { Grade } from 'ts-fsrs'

const DEFAULT_NEW_LIMIT = 20

interface State {
  decks: Deck[]
  loading: boolean
  /** Per-deck loaded words/reviews cache (loaded on demand). */
  words: Record<string, Word[]>
  reviews: Record<string, Review[]>

  loadDecks: () => Promise<void>
  createDeck: (title: string, langFrom: string, langTo: string) => Promise<Deck>
  loadPreset: (preset: PresetDeck) => Promise<Deck>
  deleteDeck: (deckId: string) => Promise<void>
  loadDeck: (deckId: string) => Promise<void>
  addWords: (
    deckId: string,
    entries: Array<{ front: string; back: string; transcription?: string; example?: string }>,
  ) => Promise<void>
  gradeCard: (deckId: string, cardId: string, g: Grade) => Promise<void>
  /** Ensures every deck's words/reviews are loaded (for the global session). */
  ensureAllLoaded: () => Promise<void>
  newLimit: number
  setNewLimit: (n: number) => Promise<void>
}

export const useStore = create<State>((set, get) => ({
  decks: [],
  loading: true,
  words: {},
  reviews: {},
  newLimit: DEFAULT_NEW_LIMIT,

  async loadDecks() {
    set({ loading: true })
    const [decks, settings] = await Promise.all([
      decksRepo.list(),
      settingsRepo.load({ newLimit: DEFAULT_NEW_LIMIT }),
    ])
    set({ decks, newLimit: settings.newLimit, loading: false })
  },

  async setNewLimit(n) {
    const clamped = Math.max(0, Math.min(200, Math.round(n)))
    await settingsRepo.save({ newLimit: clamped })
    set({ newLimit: clamped })
  },

  async ensureAllLoaded() {
    const { decks, words } = get()
    await Promise.all(
      decks.filter((d) => words[d.id] == null).map((d) => get().loadDeck(d.id)),
    )
  },

  async createDeck(title, langFrom, langTo) {
    const deck: Deck = { id: genId(), title, langFrom, langTo, createdAt: Date.now() }
    await decksRepo.save(deck)
    set((s) => ({ decks: [...s.decks, deck] }))
    return deck
  },

  async loadPreset(preset) {
    const deck = await get().createDeck(preset.title, preset.langFrom, preset.langTo)
    await get().addWords(deck.id, preset.words)
    return deck
  },

  async deleteDeck(deckId) {
    await decksRepo.remove(deckId)
    set((s) => {
      const words = { ...s.words }
      const reviews = { ...s.reviews }
      delete words[deckId]
      delete reviews[deckId]
      return { decks: s.decks.filter((d) => d.id !== deckId), words, reviews }
    })
  },

  async loadDeck(deckId) {
    const [words, reviews] = await Promise.all([
      wordsRepo.list(deckId),
      reviewsRepo.list(deckId),
    ])
    set((s) => ({
      words: { ...s.words, [deckId]: words },
      reviews: { ...s.reviews, [deckId]: reviews },
    }))
  },

  async addWords(deckId, entries) {
    const now = new Date()
    const newWords: Word[] = entries.map((e) => ({
      id: genId(),
      deckId,
      front: e.front,
      back: e.back,
      transcription: e.transcription,
      example: e.example,
      createdAt: now.getTime(),
    }))
    const newReviews: Review[] = newWords.map((w) => newReview(w.id, now))

    await wordsRepo.addMany(deckId, newWords)
    const existingReviews = get().reviews[deckId] ?? (await reviewsRepo.list(deckId))
    const merged = [...existingReviews, ...newReviews]
    await reviewsRepo.saveAll(deckId, merged)

    set((s) => ({
      words: { ...s.words, [deckId]: [...(s.words[deckId] ?? []), ...newWords] },
      reviews: { ...s.reviews, [deckId]: merged },
    }))
  },

  async gradeCard(deckId, cardId, g) {
    const now = new Date()
    const reviews = get().reviews[deckId] ?? (await reviewsRepo.list(deckId))
    const updated = reviews.map((r) => (r.cardId === cardId ? gradeReview(r, g, now) : r))
    await reviewsRepo.saveAll(deckId, updated)
    set((s) => ({ reviews: { ...s.reviews, [deckId]: updated } }))
  },
}))
