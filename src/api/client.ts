import type { Deck, Grade, Review, Word } from '@/domain/types'
import { initData } from '@/telegram/init'

// Public Worker URL; overridable via VITE_API_URL for local/staging.
const API_URL = import.meta.env.VITE_API_URL ?? 'https://lexi-api.lexi-bot.workers.dev'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_URL + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${initData()}`,
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body || res.statusText}`)
  }
  return res.json() as Promise<T>
}

// Server sends null for optional fields; normalize to undefined for the UI.
function mapWord(w: Record<string, unknown>): Word {
  return {
    id: w.id as string,
    deckId: w.deckId as string,
    front: w.front as string,
    back: w.back as string,
    transcription: (w.transcription as string | null) ?? undefined,
    example: (w.example as string | null) ?? undefined,
    createdAt: w.createdAt as number,
  }
}

function mapReview(r: Record<string, unknown>): Review {
  return {
    wordId: r.wordId as string,
    due: r.due as number,
    state: r.state as number,
    reps: r.reps as number,
    lapses: r.lapses as number,
    lastReview: (r.lastReview as number | null) ?? null,
  }
}

export interface Preset {
  id: string
  title: string
  langFrom: string
  langTo: string
  wordCount: number
}

export interface DayCount {
  date: string
  count: number
}

export interface Stats {
  overview: { totalWords: number; fresh: number; learned: number; due: number; lapses: number }
  byState: { new: number; learning: number; review: number; relearning: number }
  forecast: DayCount[]
  activity: DayCount[]
  reviewsToday: number
  reviews7d: number
  accuracy: number
  streak: number
}

export const api = {
  listDecks(): Promise<Deck[]> {
    return request<Deck[]>('/api/decks')
  },

  async getDeckCards(deckId: string): Promise<{ words: Word[]; reviews: Review[] }> {
    const data = await request<{ words: Record<string, unknown>[]; reviews: Record<string, unknown>[] }>(
      `/api/decks/${deckId}/cards`,
    )
    return { words: data.words.map(mapWord), reviews: data.reviews.map(mapReview) }
  },

  listPresets(): Promise<Preset[]> {
    return request<Preset[]>('/api/presets')
  },

  loadPreset(presetId: string): Promise<Deck> {
    return request<Deck>(`/api/presets/${presetId}/load`, { method: 'POST' })
  },

  deleteDeck(deckId: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/api/decks/${deckId}`, { method: 'DELETE' })
  },

  async gradeCard(wordId: string, grade: Grade): Promise<Review> {
    const r = await request<Record<string, unknown>>(`/api/reviews/${wordId}/grade`, {
      method: 'POST',
      body: JSON.stringify({ grade }),
    })
    return mapReview(r)
  },

  getStats(): Promise<Stats> {
    return request<Stats>('/api/stats')
  },
}
