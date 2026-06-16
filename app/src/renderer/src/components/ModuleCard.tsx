import { useState } from 'react'
import type { CourseModule, ModuleStatus } from '../api/types'

const STATUS: Record<ModuleStatus, { dot: string; bar: string; label: string }> = {
  done: { dot: 'bg-accent shadow-glow', bar: 'bg-accent', label: 'зачёт' },
  in_progress: { dot: 'bg-warn', bar: 'bg-warn', label: 'в работе' },
  not_started: { dot: 'bg-line', bar: 'bg-transparent', label: 'не начат' },
  optional: { dot: 'bg-muted', bar: 'bg-muted/40', label: 'опционально' }
}

const CONTROL: { value: ModuleStatus; label: string; active: string }[] = [
  { value: 'not_started', label: 'не начат', active: 'bg-panel text-text' },
  { value: 'in_progress', label: 'в работе', active: 'bg-warn text-bg' },
  { value: 'done', label: 'зачёт', active: 'bg-accent text-bg' }
]

function Section({ label, items }: { label: string; items: string[] }): JSX.Element {
  return (
    <div>
      <div className="label-mono mb-1.5">{label}</div>
      <ul className="space-y-1">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-text/90">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-dim" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatusControl({
  value,
  onChange
}: {
  value: ModuleStatus
  onChange: (s: ModuleStatus) => void
}): JSX.Element {
  return (
    <div>
      <div className="label-mono mb-1.5">Статус</div>
      <div className="inline-flex overflow-hidden rounded border border-line">
        {CONTROL.map((o, i) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={[
                'px-3 py-1.5 font-mono text-xs transition-colors',
                i > 0 ? 'border-l border-line' : '',
                active ? o.active : 'bg-panel-2 text-muted hover:text-text'
              ].join(' ')}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ModuleCard({
  module,
  onStatusChange
}: {
  module: CourseModule
  onStatusChange: (status: ModuleStatus) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const st = STATUS[module.status]
  const num = String(module.number).padStart(2, '0')

  return (
    <article
      className={[
        'relative overflow-hidden rounded-lg border border-line bg-panel shadow-panel transition-colors',
        module.optional ? 'opacity-70' : ''
      ].join(' ')}
    >
      <span className={`absolute left-0 top-0 h-full w-[3px] ${st.bar}`} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-4 px-5 py-3.5 text-left"
      >
        <span className="w-7 shrink-0 font-mono text-2xl tabular-nums text-muted group-hover:text-text">
          {num}
        </span>
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-sans text-[15px] text-text">{module.title}</h3>
            {module.optional && (
              <span className="label-mono shrink-0 rounded border border-line px-1.5 py-px text-[10px]">
                опц
              </span>
            )}
          </div>
          {module.niche && (
            <div className="mt-0.5 truncate text-xs text-muted">{module.niche}</div>
          )}
        </div>

        <span className="label-mono hidden shrink-0 sm:inline">{st.label}</span>
        {module.deadline_hint && (
          <span className="shrink-0 font-mono text-xs text-muted">{module.deadline_hint}</span>
        )}

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
        <div className="space-y-4 border-t border-line bg-panel-2/40 px-5 py-4 pl-6">
          <StatusControl value={module.status} onChange={onStatusChange} />
          {module.study_points.length > 0 && (
            <Section label="Что изучить" items={module.study_points} />
          )}
          {module.task.length > 0 && <Section label="Задание" items={module.task} />}
          {module.acceptance_criterion && (
            <div className="rounded border border-line border-l-2 border-l-accent bg-panel-2 px-4 py-3">
              <div className="label-mono mb-1 text-accent/80">Критерий зачёта</div>
              <p className="text-sm leading-relaxed text-text">{module.acceptance_criterion}</p>
              <div className="label-mono mt-2 text-[10px]">источник · course-ml-training.md</div>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
