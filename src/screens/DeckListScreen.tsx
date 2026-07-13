import { useState } from 'react'
import {
  Button,
  Cell,
  Input,
  List,
  Section,
  Placeholder,
} from '@telegram-apps/telegram-ui'
import { useStore } from '@/store/useStore'
import { GREEK_STARTER } from '@/data/greekStarter'
import { showAlert } from '@/telegram/init'
import type { Route } from '@/App'

export function DeckListScreen({ navigate }: { navigate: (r: Route) => void }) {
  const decks = useStore((s) => s.decks)
  const loading = useStore((s) => s.loading)
  const createDeck = useStore((s) => s.createDeck)
  const loadPreset = useStore((s) => s.loadPreset)

  const [title, setTitle] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [creating, setCreating] = useState(false)
  const [loadingPreset, setLoadingPreset] = useState(false)

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
      </List>
    </div>
  )
}
