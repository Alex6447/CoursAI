import { useState } from 'react'
import type { BacklogItem } from '../api/types'

function Check({ done }: { done: boolean }): JSX.Element {
  return (
    <span
      className={[
        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
        done ? 'border-accent bg-accent text-bg' : 'border-line bg-bg text-transparent'
      ].join(' ')}
    >
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2.5 6.2l2.3 2.3 4.7-4.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export default function WeekCard({
  week,
  items,
  defaultOpen,
  onToggle
}: {
  week: number
  items: BacklogItem[]
  defaultOpen?: boolean
  onToggle: (id: string, done: boolean) => void
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const done = items.filter((i) => i.done).length
  const total = items.length
  const complete = total > 0 && done === total
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

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
        <span className="w-16 shrink-0 font-mono text-sm text-muted group-hover:text-text">
          нед {String(week).padStart(2, '0')}
        </span>

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
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onToggle(it.id, !it.done)}
                className="flex w-full items-start gap-3 rounded px-2 py-1.5 text-left hover:bg-panel-2"
              >
                <Check done={it.done} />
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
      )}
    </article>
  )
}
