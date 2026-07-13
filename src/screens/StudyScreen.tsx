import { useEffect, useMemo, useState } from 'react'
import { Button, Card, List, Section, Placeholder, Progress } from '@telegram-apps/telegram-ui'
import { useStore } from '@/store/useStore'
import { buildQueue, type StudyItem } from '@/srs/queue'
import { RATINGS } from '@/srs/srs'
import { haptic, hapticSuccess } from '@/telegram/init'
import type { Grade } from 'ts-fsrs'
import type { Route } from '@/App'

export function StudyScreen({
  deckId,
  navigate,
}: {
  deckId: string
  navigate: (r: Route) => void
}) {
  const words = useStore((s) => s.words[deckId])
  const reviews = useStore((s) => s.reviews[deckId])
  const newLimit = useStore((s) => s.newLimit)
  const loadDeck = useStore((s) => s.loadDeck)
  const gradeCard = useStore((s) => s.gradeCard)

  // Freeze the queue when the session starts so grading doesn't reshuffle it.
  const [queue, setQueue] = useState<StudyItem[] | null>(null)
  const [pos, setPos] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)

  useEffect(() => {
    if (words == null || reviews == null) void loadDeck(deckId)
  }, [deckId, words, reviews, loadDeck])

  useEffect(() => {
    if (queue == null && words != null && reviews != null) {
      setQueue(buildQueue(words, reviews, new Date(), newLimit))
    }
  }, [queue, words, reviews, newLimit])

  const current = queue?.[pos] ?? null
  const total = queue?.length ?? 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  const finished = useMemo(() => queue != null && pos >= total, [queue, pos, total])

  async function onGrade(g: Grade) {
    if (!current) return
    haptic('light')
    await gradeCard(deckId, current.word.id, g)
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

  if (finished) {
    if (done > 0) hapticSuccess()
    return (
      <div className="screen">
        <Placeholder header="Сессия завершена" description={`Повторено карточек: ${done}`}>
          🎉
        </Placeholder>
        <div style={{ padding: 16 }}>
          <Button stretched onClick={() => navigate({ name: 'deck', deckId })}>
            Готово
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div style={{ padding: '0 0 12px' }}>
        <Progress value={progress} />
        <div style={{ textAlign: 'center', fontSize: 13, opacity: 0.6, marginTop: 6 }}>
          {done} / {total}
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
