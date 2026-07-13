import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Cell,
  Input,
  List,
  Section,
  Placeholder,
} from '@telegram-apps/telegram-ui'
import { useStore } from '@/store/useStore'
import { globalStats } from '@/srs/queue'
import { GREEK_STARTER } from '@/data/greekStarter'
import { showAlert } from '@/telegram/init'
import type { Route } from '@/App'

export function DeckListScreen({ navigate }: { navigate: (r: Route) => void }) {
  const decks = useStore((s) => s.decks)
  const loading = useStore((s) => s.loading)
  const createDeck = useStore((s) => s.createDeck)
  const loadPreset = useStore((s) => s.loadPreset)
  const wordsMap = useStore((s) => s.words)
  const reviewsMap = useStore((s) => s.reviews)
  const newLimit = useStore((s) => s.newLimit)
  const setNewLimit = useStore((s) => s.setNewLimit)
  const ensureAllLoaded = useStore((s) => s.ensureAllLoaded)

  const [title, setTitle] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [creating, setCreating] = useState(false)
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
    return globalStats(data, new Date(), newLimit)
  }, [allLoaded, decks, wordsMap, reviewsMap, newLimit])

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

  async function onCreate() {
    if (!title.trim()) return
    setCreating(true)
    const deck = await createDeck(title.trim(), from.trim() || '—', to.trim() || '—')
    setCreating(false)
    setTitle('')
    setFrom('')
    setTo('')
    navigate({ name: 'deck', deckId: deck.id })
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
            <Placeholder description="Создайте первую колоду и добавьте слова">
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

        <Section header="Новая колода">
          <Input header="Название" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Английский A1" />
          <Input header="Язык слова" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="en" />
          <Input header="Перевод" value={to} onChange={(e) => setTo(e.target.value)} placeholder="ru" />
          <div style={{ padding: '8px 16px' }}>
            <Button stretched disabled={creating || !title.trim()} onClick={onCreate}>
              Создать колоду
            </Button>
          </div>
        </Section>

        <Section
          header="Настройки"
          footer="Сколько новых слов в день показывать во всей общей сессии"
        >
          <Cell
            subtitle="новых слов в день"
            after={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Button size="s" mode="bezeled" onClick={() => void setNewLimit(newLimit - 5)}>
                  −5
                </Button>
                <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>
                  {newLimit}
                </span>
                <Button size="s" mode="bezeled" onClick={() => void setNewLimit(newLimit + 5)}>
                  +5
                </Button>
              </div>
            }
          >
            Лимит новых
          </Cell>
        </Section>
      </List>
    </div>
  )
}
