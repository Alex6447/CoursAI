import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import PracticeCard from '../components/PracticeCard'
import { addJournalEntry, getPractice, setPracticeState } from '../api/client'
import type { PracticeRow } from '../api/types'

const RULES = [
  'Не засчитывать модуль без кода или измеримого результата.',
  'Не засчитывать RAG без источников в ответе.',
  'Не засчитывать fine-tuning без сравнения с baseline.',
  'Не засчитывать продакшн-модуль без расчёта себестоимости запроса.',
  'Не засчитывать капстоун без demo/readme/one-pager.'
]

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

function Rules(): JSX.Element {
  return (
    <div className="mb-6 rounded-lg border border-line border-l-2 border-l-warn bg-panel px-5 py-4">
      <div className="label-mono mb-2 text-warn/80">Правила зачёта</div>
      <ul className="space-y-1">
        {RULES.map((r, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-text/90">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-warn" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Practice(): JSX.Element {
  const [rows, setRows] = useState<PracticeRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPractice()
      .then(setRows)
      .catch((e) => setError(String(e)))
  }, [])

  const patchRow = (id: string, patch: Partial<PracticeRow>): void => {
    setRows((cur) => (cur ? cur.map((r) => (r.id === id ? { ...r, ...patch } : r)) : cur))
  }

  // Оптимистичная смена статуса с откатом при ошибке.
  const updateStatus = (id: string, status: string): void => {
    const prev = rows?.find((r) => r.id === id)?.status
    patchRow(id, { status })
    setPracticeState(id, { status }).catch(() => {
      if (prev !== undefined) patchRow(id, { status: prev })
    })
  }

  const updateArtifact = (id: string, artifact_url: string): void => {
    const prev = rows?.find((r) => r.id === id)?.artifact_url
    patchRow(id, { artifact_url })
    setPracticeState(id, { artifact_url }).catch(() => {
      if (prev !== undefined) patchRow(id, { artifact_url: prev })
    })
  }

  const addEntry = async (id: string, data: Record<string, string>): Promise<void> => {
    await addJournalEntry(id, data)
    // Сервер возвращает только { id }, поэтому перечитываем строки для актуального журнала.
    const fresh = await getPractice()
    setRows(fresh)
  }

  const done = rows?.filter((r) => r.status === 'done').length ?? 0
  const inProgress = rows?.filter((r) => r.status === 'in-progress').length ?? 0
  const entries = rows?.reduce((n, r) => n + r.journal.length, 0) ?? 0

  return (
    <section>
      <PageHeader
        label="Модуль 02"
        title="Практика"
        subtitle="Трекер практики и журнал записей по заданиям."
      />

      {error && (
        <p className="rounded border border-line border-l-2 border-l-danger bg-panel px-4 py-3 text-sm text-danger">
          Не удалось загрузить практику: {error}
        </p>
      )}
      {!rows && !error && <p className="label-mono">загрузка…</p>}

      {rows && (
        <>
          <Rules />

          <div className="mb-6 flex items-center gap-7">
            <Stat label="всего" value={rows.length} />
            <Stat label="зачтено" value={done} accent />
            <Stat label="в работе" value={inProgress} />
            <Stat label="записей" value={entries} />
          </div>

          <div className="space-y-2.5">
            {rows.map((r) => (
              <PracticeCard
                key={r.id}
                row={r}
                onStatusChange={(status) => updateStatus(r.id, status)}
                onArtifactChange={(url) => updateArtifact(r.id, url)}
                onAddJournal={(data) => addEntry(r.id, data)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
