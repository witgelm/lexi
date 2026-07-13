import { useState } from 'react'
import { Button, List, Section, Textarea, Cell } from '@telegram-apps/telegram-ui'
import { useStore } from '@/store/useStore'
import { parseBulk } from '@/domain/import'
import { showAlert } from '@/telegram/init'
import type { Route } from '@/App'

export function AddWordsScreen({
  deckId,
  navigate,
}: {
  deckId: string
  navigate: (r: Route) => void
}) {
  const addWords = useStore((s) => s.addWords)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const parsed = parseBulk(text)

  async function onSave() {
    if (parsed.length === 0) return
    setSaving(true)
    try {
      await addWords(deckId, parsed)
      navigate({ name: 'deck', deckId })
    } catch (err) {
      showAlert(`Не удалось сохранить: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <List>
        <Section
          header="Импорт слов"
          footer="Одна карточка на строку. Разделитель — тире, точка с запятой или таб. Пример: apple — яблоко"
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'apple — яблоко\nrun — бежать — I run every day\nKatze; кошка'}
            rows={10}
          />
          <Cell subtitle="карточек распознано">{parsed.length}</Cell>
          <div style={{ padding: '8px 16px', display: 'grid', gap: 8 }}>
            <Button stretched disabled={saving || parsed.length === 0} onClick={onSave}>
              Добавить {parsed.length > 0 ? `(${parsed.length})` : ''}
            </Button>
            <Button stretched mode="plain" onClick={() => navigate({ name: 'deck', deckId })}>
              Отмена
            </Button>
          </div>
        </Section>
      </List>
    </div>
  )
}
