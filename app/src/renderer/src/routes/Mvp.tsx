import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { getMvp, setMvpDone } from '../api/client'
import type { MvpCriterion } from '../api/types'

// Рубрика оценок eval-набора (справочник из rag-mvp-spec.md).
const EVAL_LEGEND: { code: string; tone: string; text: string }[] = [
  { code: 'correct', tone: 'text-accent', text: 'ответ верный и источники релевантны' },
  { code: 'partial', tone: 'text-warn', text: 'смысл верный, но источник слабый или ответ неполный' },
  { code: 'wrong', tone: 'text-danger', text: 'ответ неверный, источник не подтверждает' },
  { code: 'no_answer_ok', tone: 'text-muted', text: 'честный отказ — ответа нет в документах' }
]

function CheckRow({
  item,
  onToggle
}: {
  item: MvpCriterion
  onToggle: (done: boolean) => void
}): JSX.Element {
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(!item.done)}
        className="flex w-full items-start gap-3 rounded px-2 py-1.5 text-left hover:bg-panel-2"
      >
        <span
          className={[
            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
            item.done ? 'border-accent bg-accent text-bg' : 'border-line bg-bg text-transparent'
          ].join(' ')}
        >
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.2l2.3 2.3 4.7-4.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span
          className={[
            'text-sm leading-relaxed',
            item.done ? 'text-muted line-through' : 'text-text/90'
          ].join(' ')}
        >
          {item.text}
        </span>
      </button>
    </li>
  )
}

function VersionCard({
  group,
  items,
  onToggle
}: {
  group: string
  items: MvpCriterion[]
  onToggle: (id: string, done: boolean) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const done = items.filter((i) => i.done).length
  const total = items.length
  const complete = total > 0 && done === total
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const label = group.replace(/^v/, 'Версия ')

  return (
    <article className="relative overflow-hidden rounded-lg border border-line bg-panel shadow-panel">
      <span
        className={`absolute left-0 top-0 h-full w-[3px] ${complete ? 'bg-accent' : 'bg-transparent'}`}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-4 px-5 py-3.5 text-left"
      >
        <span className="shrink-0 font-mono text-sm text-text">{label}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2">
          <span
            className={`block h-full rounded-full transition-all ${complete ? 'bg-accent' : 'bg-accent-dim'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
          {done}/{total}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="space-y-1 border-t border-line bg-panel-2/40 px-5 py-3 pl-6">
          {items.map((it) => (
            <CheckRow key={it.id} item={it} onToggle={(d) => onToggle(it.id, d)} />
          ))}
        </ul>
      )}
    </article>
  )
}

function EvalReference(): JSX.Element {
  return (
    <div className="mb-8 rounded-lg border border-line bg-panel px-5 py-4 shadow-panel">
      <div className="label-mono mb-1 text-accent/80">Eval-набор · справочник</div>
      <p className="mb-3 text-sm leading-relaxed text-muted">
        Минимум 20 вопросов. По каждому фиксируются: найденные chunks, ответ модели,
        ожидаемый ответ, источник и оценка. Шкала оценки:
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {EVAL_LEGEND.map((e) => (
          <li key={e.code} className="flex items-start gap-3 text-sm leading-relaxed text-text/90">
            <span className={`shrink-0 font-mono text-xs ${e.tone}`}>{e.code}</span>
            <span className="text-muted">— {e.text}</span>
          </li>
        ))}
      </ul>
      <div className="label-mono mt-3 text-[10px]">источник · rag-mvp-spec.md</div>
    </div>
  )
}

export default function Mvp(): JSX.Element {
  const [items, setItems] = useState<MvpCriterion[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMvp()
      .then(setItems)
      .catch((e) => setError(String(e)))
  }, [])

  // Оптимистичная отметка с откатом при ошибке.
  const toggle = (id: string, done: boolean): void => {
    setItems((cur) => (cur ? cur.map((i) => (i.id === id ? { ...i, done } : i)) : cur))
    setMvpDone(id, done).catch(() => {
      setItems((cur) => (cur ? cur.map((i) => (i.id === id ? { ...i, done: !done } : i)) : cur))
    })
  }

  const acceptance = useMemo(
    () => items?.filter((i) => i.group === 'acceptance') ?? [],
    [items]
  )
  const versions = useMemo(() => {
    if (!items) return []
    const groups = new Map<string, MvpCriterion[]>()
    for (const i of items) {
      if (i.group === 'acceptance') continue
      if (!groups.has(i.group)) groups.set(i.group, [])
      groups.get(i.group)!.push(i)
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  const accDone = acceptance.filter((i) => i.done).length
  const accTotal = acceptance.length
  const accPct = accTotal > 0 ? Math.round((accDone / accTotal) * 100) : 0

  return (
    <section>
      <PageHeader
        label="Модуль 04"
        title="RAG MVP"
        subtitle="Критерии приёмки MVP и backlog разработки версий 0.1–0.4."
      />

      {error && (
        <p className="rounded border border-line border-l-2 border-l-danger bg-panel px-4 py-3 text-sm text-danger">
          Не удалось загрузить MVP: {error}
        </p>
      )}
      {!items && !error && <p className="label-mono">загрузка…</p>}

      {items && (
        <>
          {/* Прогресс MVP = доля выполненных критериев приёмки. */}
          <div className="mb-8 rounded-lg border border-line border-l-2 border-l-accent bg-panel px-5 py-4 shadow-panel">
            <div className="flex items-center justify-between gap-4">
              <div className="label-mono text-accent/80">Готовность MVP</div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl tabular-nums text-accent">{accPct}%</span>
                <span className="label-mono">
                  {accDone}/{accTotal} критериев приёмки
                </span>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel-2">
              <span
                className="block h-full rounded-full bg-accent transition-all"
                style={{ width: `${accPct}%` }}
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="mb-3 font-mono text-lg text-text">Критерии приёмки MVP</h2>
            <div className="rounded-lg border border-line bg-panel px-5 py-3 shadow-panel">
              <ul className="space-y-1">
                {acceptance.map((it) => (
                  <CheckRow key={it.id} item={it} onToggle={(d) => toggle(it.id, d)} />
                ))}
              </ul>
            </div>
          </div>

          <EvalReference />

          <div>
            <h2 className="mb-3 font-mono text-lg text-text">Backlog разработки</h2>
            <div className="space-y-2.5">
              {versions.map(([group, its]) => (
                <VersionCard key={group} group={group} items={its} onToggle={toggle} />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
