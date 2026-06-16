import { useState } from 'react'
import type { JournalEntry, PracticeRow } from '../api/types'

// Статусы практики приходят из таблицы прогресса в дефисной нотации.
const STATUS: Record<string, { dot: string; bar: string; label: string }> = {
  done: { dot: 'bg-accent shadow-glow', bar: 'bg-accent', label: 'зачёт' },
  'in-progress': { dot: 'bg-warn', bar: 'bg-warn', label: 'в работе' },
  'not-started': { dot: 'bg-line', bar: 'bg-transparent', label: 'не начат' },
  optional: { dot: 'bg-muted', bar: 'bg-muted/40', label: 'опционально' }
}

const CONTROL: { value: string; label: string; active: string }[] = [
  { value: 'not-started', label: 'не начат', active: 'bg-panel text-text' },
  { value: 'in-progress', label: 'в работе', active: 'bg-warn text-bg' },
  { value: 'done', label: 'зачёт', active: 'bg-accent text-bg' }
]

// Поля журнала по шаблону записи из ml-training-practice-log.md.
export const JOURNAL_FIELDS: { key: string; label: string; area?: boolean }[] = [
  { key: 'goal', label: 'Цель', area: true },
  { key: 'dataset', label: 'Датасет/документы' },
  { key: 'code', label: 'Код/репозиторий' },
  { key: 'metrics', label: 'Метрики' },
  { key: 'result', label: 'Что получилось', area: true },
  { key: 'broke', label: 'Что сломалось', area: true },
  { key: 'learned', label: 'Что понял', area: true },
  { key: 'to_mvp', label: 'Что переносится в MVP' },
  { key: 'next', label: 'Следующий шаг' }
]

const FIELD_LABEL = Object.fromEntries(JOURNAL_FIELDS.map((f) => [f.key, f.label]))

function meta(row: PracticeRow): string {
  const m = row.module_ref.match(/^\d+/)
  return m ? `модуль ${m[0]}` : row.module_ref
}

function StatusControl({
  value,
  onChange
}: {
  value: string
  onChange: (s: string) => void
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

function JournalEntryCard({ entry }: { entry: JournalEntry }): JSX.Element {
  const date = entry.created_at.slice(0, 16).replace('T', ' ')
  const fields = Object.entries(entry.data).filter(([, v]) => v && v.trim())
  return (
    <div className="rounded border border-line bg-panel-2 px-4 py-3">
      <div className="label-mono mb-2 text-accent/80">{date}</div>
      <dl className="space-y-1.5">
        {fields.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[150px_1fr] gap-3 text-sm">
            <dt className="label-mono pt-0.5">{FIELD_LABEL[k] ?? k}</dt>
            <dd className="whitespace-pre-wrap leading-relaxed text-text/90">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function JournalForm({
  onSubmit
}: {
  onSubmit: (data: Record<string, string>) => Promise<void>
}): JSX.Element {
  const empty = Object.fromEntries(JOURNAL_FIELDS.map((f) => [f.key, '']))
  const [values, setValues] = useState<Record<string, string>>(empty)
  const [saving, setSaving] = useState(false)

  const filled = Object.values(values).some((v) => v.trim())

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!filled || saving) return
    setSaving(true)
    const data = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()])
    )
    try {
      await onSubmit(data)
      setValues(empty)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="label-mono">Новая запись журнала</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {JOURNAL_FIELDS.map((f) => (
          <label key={f.key} className={f.area ? 'sm:col-span-2' : ''}>
            <span className="label-mono mb-1 block normal-case tracking-normal text-muted">
              {f.label}
            </span>
            {f.area ? (
              <textarea
                rows={2}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="w-full resize-y rounded border border-line bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent-dim"
              />
            ) : (
              <input
                type="text"
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="w-full rounded border border-line bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent-dim"
              />
            )}
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={!filled || saving}
        className="rounded border border-accent-dim bg-accent px-4 py-2 font-mono text-xs text-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? 'сохранение…' : 'Добавить запись'}
      </button>
    </form>
  )
}

export default function PracticeCard({
  row,
  onStatusChange,
  onArtifactChange,
  onAddJournal
}: {
  row: PracticeRow
  onStatusChange: (status: string) => void
  onArtifactChange: (url: string) => void
  onAddJournal: (data: Record<string, string>) => Promise<void>
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [artifact, setArtifact] = useState(row.artifact_url)
  const st = STATUS[row.status] ?? STATUS['not-started']

  const commitArtifact = (): void => {
    if (artifact !== row.artifact_url) onArtifactChange(artifact.trim())
  }

  return (
    <article className="relative overflow-hidden rounded-lg border border-line bg-panel shadow-panel">
      <span className={`absolute left-0 top-0 h-full w-[3px] ${st.bar}`} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-4 px-5 py-3.5 text-left"
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} />

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-sans text-[15px] text-text">{row.module_ref}</h3>
          {row.artifact && (
            <div className="mt-0.5 truncate text-xs text-muted">{row.artifact}</div>
          )}
        </div>

        {row.journal.length > 0 && (
          <span className="shrink-0 font-mono text-xs text-muted">
            журнал · {row.journal.length}
          </span>
        )}
        <span className="label-mono hidden shrink-0 sm:inline">{st.label}</span>

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
          <StatusControl value={row.status} onChange={onStatusChange} />

          {row.metric_criterion && (
            <div>
              <div className="label-mono mb-1.5">Метрика / критерий</div>
              <p className="text-sm leading-relaxed text-text/90">{row.metric_criterion}</p>
            </div>
          )}

          <div>
            <div className="label-mono mb-1.5">Ссылка на артефакт</div>
            <input
              type="text"
              value={artifact}
              placeholder="URL репозитория, ноутбука или заметки"
              onChange={(e) => setArtifact(e.target.value)}
              onBlur={commitArtifact}
              onKeyDown={(e) => e.key === 'Enter' && commitArtifact()}
              className="w-full rounded border border-line bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent-dim"
            />
          </div>

          {row.journal.length > 0 && (
            <div className="space-y-2">
              <div className="label-mono">Журнал ({row.journal.length})</div>
              {[...row.journal]
                .sort((a, b) => b.id - a.id)
                .map((e) => (
                  <JournalEntryCard key={e.id} entry={e} />
                ))}
            </div>
          )}

          <JournalForm onSubmit={onAddJournal} />

          <div className="label-mono text-[10px]">источник · ml-training-practice-log.md</div>
        </div>
      )}
    </article>
  )
}
