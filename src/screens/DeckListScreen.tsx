import { useEffect, useMemo, useState } from 'react'
import { Button, Cell, List, Section, Placeholder } from '@telegram-apps/telegram-ui'
import { useStore } from '@/store/useStore'
import { globalStats } from '@/srs/queue'
import { GREEK_STARTER } from '@/data/greekStarter'
import { showAlert } from '@/telegram/init'
import type { Route } from '@/App'

export function DeckListScreen({ navigate }: { navigate: (r: Route) => void }) {
  const decks = useStore((s) => s.decks)
  const loading = useStore((s) => s.loading)
  const loadPreset = useStore((s) => s.loadPreset)
  const wordsMap = useStore((s) => s.words)
  const reviewsMap = useStore((s) => s.reviews)
  const ensureAllLoaded = useStore((s) => s.ensureAllLoaded)

  const [loadingPreset, setLoadingPreset] = useState(false)

  // Load every deck's cards so we can show today's aggregate counts.
  useEffect(() => {
    if (!loading && decks.length > 0) void ensureAllLoaded()
  }, [loading, decks, ensureAllLoaded])

  const allLoaded = decks.length > 0 && decks.every((d) => wordsMap[d.id] != null)
  const today = useMemo(() => {
    if (!allLoaded) return null
    const data = decks.map((d) => ({
      words: wordsMap[d.id] ?? [],
      reviews: reviewsMap[d.id] ?? [],
    }))
    return globalStats(data, Date.now())
  }, [allLoaded, decks, wordsMap, reviewsMap])

  const toStudy = today ? today.due + today.fresh : 0

  async function onLoadGreek() {
    setLoadingPreset(true)
    try {
      const deck = await loadPreset(GREEK_STARTER)
      navigate({ name: 'deck', deckId: deck.id })
    } catch (err) {
      showAlert(`Не удалось загрузить колоду: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoadingPreset(false)
    }
  }

  return (
    <div className="screen">
      <List>
        <Section header="Lexi" footer="Учим слова карточками с интервальными повторениями">
          <Cell subtitle="от греч. λέξις — «слово»">📖 Ваш словарь</Cell>
        </Section>

        {decks.length > 0 && (
          <Section
            header="Сегодня"
            footer={
              today
                ? `К повторению: ${today.due} · новых: ${today.fresh} (из всех колод)`
                : 'Считаем, что созрело…'
            }
          >
            <div style={{ padding: '8px 16px' }}>
              <Button
                stretched
                size="l"
                disabled={!today || toStudy === 0}
                onClick={() => navigate({ name: 'study', deckId: null })}
              >
                {toStudy > 0 ? `Учить всё на сегодня (${toStudy})` : 'На сегодня всё ✅'}
              </Button>
            </div>
          </Section>
        )}

        <Section header="Мои колоды">
          {loading && <Cell>Загрузка…</Cell>}
          {!loading && decks.length === 0 && (
            <Placeholder description="Загрузите готовый словарь ниже, чтобы начать">
              📚
            </Placeholder>
          )}
          {decks.map((d) => (
            <Cell
              key={d.id}
              subtitle={`${d.langFrom} → ${d.langTo}`}
              onClick={() => navigate({ name: 'deck', deckId: d.id })}
            >
              {d.title}
            </Cell>
          ))}
        </Section>

        <Section
          header="Готовые колоды"
          footer="Быстрый старт — 100 частотных греческих слов с транскрипцией"
        >
          <Cell
            subtitle={`${GREEK_STARTER.words.length} слов · ${GREEK_STARTER.langFrom} → ${GREEK_STARTER.langTo}`}
            after={
              <Button size="s" loading={loadingPreset} disabled={loadingPreset} onClick={onLoadGreek}>
                Загрузить
              </Button>
            }
          >
            🇬🇷 {GREEK_STARTER.title}
          </Cell>
        </Section>
      </List>
    </div>
  )
}
