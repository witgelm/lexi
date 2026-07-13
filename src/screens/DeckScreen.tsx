import { useEffect, useMemo } from 'react'
import { Button, Cell, List, Section, Banner } from '@telegram-apps/telegram-ui'
import { useStore } from '@/store/useStore'
import { deckStats } from '@/srs/queue'
import type { Route } from '@/App'

export function DeckScreen({
  deckId,
  navigate,
}: {
  deckId: string
  navigate: (r: Route) => void
}) {
  const deck = useStore((s) => s.decks.find((d) => d.id === deckId))
  const words = useStore((s) => s.words[deckId])
  const reviews = useStore((s) => s.reviews[deckId])
  const loadDeck = useStore((s) => s.loadDeck)
  const deleteDeck = useStore((s) => s.deleteDeck)

  useEffect(() => {
    if (words == null) void loadDeck(deckId)
  }, [deckId, words, loadDeck])

  const stats = useMemo(() => {
    if (!words || !reviews) return null
    return deckStats(words, reviews, new Date())
  }, [words, reviews])

  if (!deck) {
    return (
      <div className="screen">
        <Button onClick={() => navigate({ name: 'decks' })}>← Назад</Button>
      </div>
    )
  }

  const toStudy = stats ? stats.due + stats.fresh : 0

  return (
    <div className="screen">
      <List>
        <Section header={deck.title} footer={`${deck.langFrom} → ${deck.langTo}`}>
          <Cell>Всего слов: {stats?.total ?? '…'}</Cell>
          <Cell>К повторению сегодня: {stats?.due ?? '…'}</Cell>
          <Cell>Новых сегодня: {stats?.fresh ?? '…'}</Cell>
        </Section>

        <Section>
          {toStudy > 0 ? (
            <div style={{ padding: '8px 16px' }}>
              <Button stretched size="l" onClick={() => navigate({ name: 'study', deckId })}>
                Учить ({toStudy})
              </Button>
            </div>
          ) : (
            <Banner header="На сегодня всё!" description="Возвращайтесь позже за повторениями." />
          )}
        </Section>

        <Section>
          <Cell
            onClick={() => navigate({ name: 'decks' })}
          >
            ← К списку колод
          </Cell>
          <Cell
            style={{ color: 'var(--tgui--destructive_text_color)' }}
            onClick={async () => {
              await deleteDeck(deckId)
              navigate({ name: 'decks' })
            }}
          >
            Удалить колоду
          </Cell>
        </Section>
      </List>
    </div>
  )
}
