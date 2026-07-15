import { useEffect, useState } from 'react'
import { Button, Cell, List, Section, Placeholder } from '@telegram-apps/telegram-ui'
import { api, type Stats } from '@/api/client'
import { showAlert } from '@/telegram/init'
import type { Route } from '@/App'

export function StatsScreen({ navigate }: { navigate: (r: Route) => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch((err) => {
        setError(true)
        showAlert(`Не удалось загрузить статистику: ${err instanceof Error ? err.message : err}`)
      })
  }, [])

  if (error) {
    return (
      <div className="screen">
        <Placeholder header="Ошибка" description="Не удалось загрузить статистику">
          ⚠️
        </Placeholder>
        <div style={{ padding: 16 }}>
          <Button stretched onClick={() => navigate({ name: 'decks' })}>
            Назад
          </Button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="screen">
        <Placeholder description="Считаем статистику…">⏳</Placeholder>
      </div>
    )
  }

  const maxActivity = Math.max(1, ...stats.activity.map((d) => d.count))

  return (
    <div className="screen">
      <List>
        <Section header="Сводка">
          <Cell before="🔥" subtitle="дней подряд">
            Серия: {stats.streak}
          </Cell>
          <Cell before="✅" subtitle="повторено сегодня">
            Сегодня: {stats.reviewsToday}
          </Cell>
          <Cell before="🎯" subtitle="доля Good/Easy за 6 мес">
            Точность: {stats.accuracy}%
          </Cell>
          <Cell before="🗓" subtitle="за 7 дней">
            Повторений: {stats.reviews7d}
          </Cell>
        </Section>

        <Section header="Слова">
          <Cell after={String(stats.overview.totalWords)}>Всего</Cell>
          <Cell after={String(stats.overview.learned)}>Изучается</Cell>
          <Cell after={String(stats.overview.fresh)}>Новые</Cell>
          <Cell after={String(stats.overview.due)}>К повторению сейчас</Cell>
          <Cell after={String(stats.overview.lapses)}>Ошибок (всего)</Cell>
        </Section>

        <Section header="По состоянию FSRS">
          <Cell after={String(stats.byState.new)}>Новые</Cell>
          <Cell after={String(stats.byState.learning)}>Заучиваются</Cell>
          <Cell after={String(stats.byState.review)}>На повторении</Cell>
          <Cell after={String(stats.byState.relearning)}>Переучиваются</Cell>
        </Section>

        <Section header="Активность за 30 дней">
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 2,
              height: 60,
              padding: '8px 16px',
            }}
          >
            {stats.activity.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count}`}
                style={{
                  flex: 1,
                  height: `${Math.max(4, (d.count / maxActivity) * 100)}%`,
                  background:
                    d.count > 0
                      ? 'var(--tgui--link_color)'
                      : 'var(--tgui--secondary_fill, rgba(127,127,127,0.2))',
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        </Section>

        <Section header="Прогноз нагрузки (7 дней)">
          {stats.forecast.map((d) => (
            <Cell key={d.date} after={String(d.count)}>
              {d.date.slice(5)}
            </Cell>
          ))}
        </Section>

        <Section>
          <Cell onClick={() => navigate({ name: 'decks' })}>← К списку колод</Cell>
        </Section>
      </List>
    </div>
  )
}
