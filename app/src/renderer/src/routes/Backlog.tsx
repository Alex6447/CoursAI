import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import WeekCard from '../components/WeekCard'
import { getBacklog, getMetrics, setBacklogDone } from '../api/client'
import type { BacklogItem, Metric } from '../api/types'

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }): JSX.Element {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-mono text-xl tabular-nums ${accent ? 'text-accent' : 'text-text'}`}>
        {value}
      </span>
      <span className="label-mono">{label}</span>
    </div>
  )
}

function Metrics({ metrics }: { metrics: Metric[] }): JSX.Element {
  return (
    <div className="mb-6 rounded-lg border border-line bg-panel px-5 py-4 shadow-panel">
      <div className="label-mono mb-3 text-accent/80">Метрики 90 дней</div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {metrics.map((m) => (
          <li key={m.id} className="flex items-start gap-3 text-sm leading-relaxed text-text/90">
            {m.target && (
              <span className="mt-0.5 shrink-0 rounded border border-line bg-panel-2 px-2 py-0.5 font-mono text-xs tabular-nums text-accent">
                {m.target}
              </span>
            )}
            <span>{m.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Восстанавливаем человекочитаемый заголовок фазы из её диапазона недель.
function phaseTitle(phase: string): string {
  return `Недели ${phase}`
}

export default function Backlog(): JSX.Element {
  const [items, setItems] = useState<BacklogItem[] | null>(null)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getBacklog(), getMetrics()])
      .then(([b, m]) => {
        setItems(b)
        setMetrics(m)
      })
      .catch((e) => setError(String(e)))
  }, [])

  // Оптимистичная отметка пункта с откатом при ошибке.
  const toggle = (id: string, done: boolean): void => {
    setItems((cur) => (cur ? cur.map((i) => (i.id === id ? { ...i, done } : i)) : cur))
    setBacklogDone(id, done).catch(() => {
      setItems((cur) => (cur ? cur.map((i) => (i.id === id ? { ...i, done: !done } : i)) : cur))
    })
  }

  // Группировка: фаза → недели → пункты, в порядке появления.
  const phases = useMemo(() => {
    if (!items) return []
    const byPhase = new Map<string, Map<number, BacklogItem[]>>()
    for (const it of items) {
      if (!byPhase.has(it.phase)) byPhase.set(it.phase, new Map())
      const weeks = byPhase.get(it.phase)!
      if (!weeks.has(it.week)) weeks.set(it.week, [])
      weeks.get(it.week)!.push(it)
    }
    return [...byPhase.entries()].map(([phase, weeks]) => ({
      phase,
      weeks: [...weeks.entries()].sort((a, b) => a[0] - b[0])
    }))
  }, [items])

  const totalDone = items?.filter((i) => i.done).length ?? 0
  const total = items?.length ?? 0

  return (
    <section>
      <PageHeader
        label="Модуль 03"
        title="90 дней"
        subtitle="Backlog по фазам и неделям с чек-листами и метриками."
      />

      {error && (
        <p className="rounded border border-line border-l-2 border-l-danger bg-panel px-4 py-3 text-sm text-danger">
          Не удалось загрузить backlog: {error}
        </p>
      )}
      {!items && !error && <p className="label-mono">загрузка…</p>}

      {items && (
        <>
          {metrics.length > 0 && <Metrics metrics={metrics} />}

          <div className="mb-6 flex items-center gap-7">
            <Stat label="пунктов" value={total} />
            <Stat label="выполнено" value={totalDone} accent />
            <Stat label="% " value={total > 0 ? Math.round((totalDone / total) * 100) : 0} />
          </div>

          <div className="space-y-8">
            {phases.map(({ phase, weeks }) => {
              const phaseItems = weeks.flatMap(([, its]) => its)
              const pDone = phaseItems.filter((i) => i.done).length
              const pTotal = phaseItems.length
              const pPct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0
              return (
                <div key={phase}>
                  <div className="mb-3 flex items-center gap-4">
                    <h2 className="font-mono text-lg text-text">{phaseTitle(phase)}</h2>
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-panel-2">
                      <span
                        className="block h-full rounded-full bg-accent transition-all"
                        style={{ width: `${pPct}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs tabular-nums text-muted">
                      {pDone}/{pTotal}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {weeks.map(([week, its]) => (
                      <WeekCard key={week} week={week} items={its} onToggle={toggle} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
