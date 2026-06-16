import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDod, getHealth, getOverview, setDodDone } from '../api/client'
import PageHeader from '../components/PageHeader'
import type { CurrentFocus, Dimension, DodItem, Overview } from '../api/types'

type BackendState = 'pending' | 'ok' | 'down'

function Gauge({ label, dim }: { label: string; dim: Dimension }): JSX.Element {
  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <div className="flex items-baseline justify-between">
        <span className="label-mono">{label}</span>
        <span className="font-mono text-2xl tabular-nums text-text">
          {dim.percent}
          <span className="text-base text-muted">%</span>
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-panel-2">
        <div
          className="h-full rounded-full bg-accent shadow-glow transition-[width] duration-500"
          style={{ width: `${dim.percent}%` }}
        />
      </div>
      <div className="mt-2 font-mono text-xs tabular-nums text-muted">
        {dim.done}/{dim.total}
      </div>
    </div>
  )
}

const FOCUS_HINT: Record<CurrentFocus['kind'], string> = {
  backlog: 'Перейти к 90-дневному плану →',
  course: 'Перейти к модулю курса →',
  mvp: 'Перейти к критериям RAG MVP →',
  done: ''
}

function FocusCard({ focus }: { focus: CurrentFocus | null }): JSX.Element {
  const navigate = useNavigate()

  if (!focus || focus.kind === 'done') {
    return (
      <div className="mt-6 rounded-lg border border-line bg-panel p-5 shadow-panel">
        <div className="label-mono mb-2">Сейчас работаю над</div>
        <p className="font-mono text-lg text-text">
          {focus ? 'Все критерии закрыты — можно паковать кейс' : '— ещё не определено'}
        </p>
      </div>
    )
  }

  const clickable = focus.screen !== ''
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => clickable && navigate(focus.screen)}
      className="group mt-6 block w-full rounded-lg border border-line border-l-2 border-l-accent bg-panel p-5 text-left shadow-panel transition-colors hover:bg-panel-2 disabled:cursor-default"
    >
      <div className="label-mono mb-2 text-accent/80">Сейчас работаю над</div>
      <div className="mb-1 label-mono text-muted">{focus.context}</div>
      <p className="font-mono text-lg leading-snug text-text">{focus.title}</p>
      {clickable && (
        <span className="mt-3 inline-block font-mono text-xs text-accent opacity-80 group-hover:opacity-100">
          {FOCUS_HINT[focus.kind]}
        </span>
      )}
    </button>
  )
}

function DodChecklist({
  items,
  onToggle
}: {
  items: DodItem[]
  onToggle: (id: string, done: boolean) => void
}): JSX.Element {
  const done = items.filter((i) => i.done).length
  return (
    <div className="mt-6 rounded-lg border border-line bg-panel px-5 py-4 shadow-panel">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="label-mono">Definition of Done · проект</span>
        <span className="font-mono text-xs tabular-nums text-muted">
          {done}/{items.length}
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onToggle(it.id, !it.done)}
              className="flex w-full items-start gap-3 rounded px-2 py-1.5 text-left hover:bg-panel-2"
            >
              <span
                className={[
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
                  it.done ? 'border-accent bg-accent text-bg' : 'border-line bg-bg text-transparent'
                ].join(' ')}
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2.5 6.2l2.3 2.3 4.7-4.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span
                className={[
                  'text-sm leading-relaxed',
                  it.done ? 'text-muted line-through' : 'text-text/90'
                ].join(' ')}
              >
                {it.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Home(): JSX.Element {
  const [backend, setBackend] = useState<BackendState>('pending')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [dod, setDod] = useState<DodItem[]>([])

  useEffect(() => {
    getHealth()
      .then((h) => setBackend(h.status === 'ok' ? 'ok' : 'down'))
      .catch(() => setBackend('down'))
    getOverview().then(setOverview).catch(() => setOverview(null))
    getDod().then(setDod).catch(() => setDod([]))
  }, [])

  // Отметка DoD оптимистична; затем перечитываем overview, чтобы сводка совпала.
  const toggleDod = (id: string, done: boolean): void => {
    setDod((cur) => cur.map((d) => (d.id === id ? { ...d, done } : d)))
    setDodDone(id, done)
      .then(() => getOverview())
      .then(setOverview)
      .catch(() => {
        setDod((cur) => cur.map((d) => (d.id === id ? { ...d, done: !done } : d)))
      })
  }

  const led = backend === 'ok' ? 'bg-accent' : backend === 'down' ? 'bg-danger' : 'bg-warn'
  const ledText =
    backend === 'ok' ? 'связь установлена' : backend === 'down' ? 'нет связи' : 'проверка…'

  const empty: Dimension = { done: 0, total: 0, percent: 0 }

  return (
    <section>
      <PageHeader
        label="Обзор"
        title="Где я сейчас"
        subtitle="Прогресс по трём измерениям и текущий фокус работы. Данные появятся по мере отметок в разделах."
      />

      <div className="grid grid-cols-3 gap-4">
        <Gauge label="Теория" dim={overview?.theory ?? empty} />
        <Gauge label="Практика" dim={overview?.practice ?? empty} />
        <Gauge label="Проекты" dim={overview?.projects ?? empty} />
      </div>

      <FocusCard focus={overview?.current_focus ?? null} />

      {dod.length > 0 && <DodChecklist items={dod} onToggle={toggleDod} />}

      <div className="mt-6 flex items-center gap-2.5 text-sm text-muted">
        <span className={`h-2.5 w-2.5 rounded-full ${led}`} />
        <span className="label-mono">Backend</span>
        <span>{ledText}</span>
      </div>
    </section>
  )
}
