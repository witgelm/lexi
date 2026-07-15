import { useEffect, useMemo, useState } from 'react'
import { Button, Card, List, Section, Placeholder, Progress } from '@telegram-apps/telegram-ui'
import { useStore } from '@/store/useStore'
import { buildGlobalQueue, buildQueue, type StudyItem } from '@/srs/queue'
import { RATINGS } from '@/srs/ratings'
import { haptic, hapticSuccess } from '@/telegram/init'
import type { Grade } from '@/domain/types'
import type { Route } from '@/App'

export function StudyScreen({
  deckId,
  navigate,
}: {
  // null → cross-deck "study everything due today" session.
  deckId: string | null
  navigate: (r: Route) => void
}) {
  const decks = useStore((s) => s.decks)
  const wordsMap = useStore((s) => s.words)
  const reviewsMap = useStore((s) => s.reviews)
  const loadDeck = useStore((s) => s.loadDeck)
  const ensureAllLoaded = useStore((s) => s.ensureAllLoaded)
  const gradeCard = useStore((s) => s.gradeCard)

  // Freeze the queue when the session starts so grading doesn't reshuffle it.
  const [queue, setQueue] = useState<StudyItem[] | null>(null)
  const [pos, setPos] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)

  const backRoute: Route = deckId ? { name: 'deck', deckId } : { name: 'decks' }

  // Ensure the needed decks are loaded.
  useEffect(() => {
    if (deckId) {
      if (wordsMap[deckId] == null) void loadDeck(deckId)
    } else {
      void ensureAllLoaded()
    }
  }, [deckId, wordsMap, loadDeck, ensureAllLoaded])

  // Build the frozen queue once the data is ready.
  useEffect(() => {
    if (queue != null) return
    const now = Date.now()
    if (deckId) {
      const words = wordsMap[deckId]
      const reviews = reviewsMap[deckId]
      if (words != null && reviews != null) setQueue(buildQueue(words, reviews, now))
    } else {
      const allReady = decks.every((d) => wordsMap[d.id] != null && reviewsMap[d.id] != null)
      if (allReady) {
        const data = decks.map((d) => ({
          words: wordsMap[d.id] ?? [],
          reviews: reviewsMap[d.id] ?? [],
        }))
        setQueue(buildGlobalQueue(data, now))
      }
    }
  }, [queue, deckId, decks, wordsMap, reviewsMap])

  const current = queue?.[pos] ?? null
  const total = queue?.length ?? 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  const finished = useMemo(() => queue != null && pos >= total, [queue, pos, total])

  function onGrade(g: Grade) {
    if (!current) return
    haptic('light')
    // Grade against the card's own deck — cards may come from several decks.
    // Fire-and-forget: the store updates memory now and persists in the
    // background, so the next card shows without waiting on CloudStorage.
    gradeCard(current.word.deckId, current.word.id, g)
    setDone((d) => d + 1)
    setRevealed(false)
    setPos((p) => p + 1)
  }

  if (queue == null) {
    return (
      <div className="screen">
        <Placeholder description="Готовим карточки…">⏳</Placeholder>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="screen">
        <Placeholder header="Нечего повторять" description="На сегодня карточек нет.">
          ✅
        </Placeholder>
        <div style={{ padding: 16 }}>
          <Button stretched onClick={() => navigate(backRoute)}>
            Назад
          </Button>
        </div>
      </div>
    )
  }

  if (finished) {
    if (done > 0) hapticSuccess()
    return (
      <div className="screen">
        <Placeholder header="Сессия завершена" description={`Повторено карточек: ${done}`}>
          🎉
        </Placeholder>
        <div style={{ padding: 16 }}>
          <Button stretched onClick={() => navigate(backRoute)}>
            Готово
          </Button>
        </div>
      </div>
    )
  }

  const deckTitle = deckId ? null : decks.find((d) => d.id === current!.word.deckId)?.title

  return (
    <div className="screen">
      <div style={{ padding: '0 0 12px' }}>
        <Progress value={progress} />
        <div style={{ textAlign: 'center', fontSize: 13, opacity: 0.6, marginTop: 6 }}>
          {done} / {total}
          {deckTitle && <span> · {deckTitle}</span>}
        </div>
      </div>

      <List>
        <Section>
          <Card style={{ width: '100%' }}>
            <div className="card-face">
              <div className="card-front">{current!.word.front}</div>
              {current!.word.transcription && (
                <div className="card-sub">[{current!.word.transcription}]</div>
              )}
              {revealed && (
                <>
                  <div className="card-back">{current!.word.back}</div>
                  {current!.word.example && (
                    <div className="card-sub">{current!.word.example}</div>
                  )}
                </>
              )}
            </div>
          </Card>
        </Section>
      </List>

      {!revealed ? (
        <Button stretched size="l" onClick={() => setRevealed(true)}>
          Показать ответ
        </Button>
      ) : (
        <div className="grade-row">
          {RATINGS.map((r) => (
            <Button
              key={r.grade}
              size="m"
              mode={r.grade === 1 ? 'gray' : 'bezeled'}
              onClick={() => onGrade(r.grade)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
