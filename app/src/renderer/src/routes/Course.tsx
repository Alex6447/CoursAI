import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import ModuleCard from '../components/ModuleCard'
import { getCourse, setModuleStatus } from '../api/client'
import type { CourseModule, ModuleStatus } from '../api/types'

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

export default function Course(): JSX.Element {
  const [modules, setModules] = useState<CourseModule[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCourse()
      .then(setModules)
      .catch((e) => setError(String(e)))
  }, [])

  // Оптимистичное обновление: меняем статус локально сразу, при ошибке откатываем.
  const updateStatus = (id: string, status: ModuleStatus): void => {
    let prev: ModuleStatus | undefined
    setModules((cur) =>
      cur
        ? cur.map((m) => {
            if (m.id !== id) return m
            prev = m.status
            return { ...m, status }
          })
        : cur
    )
    setModuleStatus(id, status).catch(() => {
      setModules((cur) =>
        cur && prev ? cur.map((m) => (m.id === id ? { ...m, status: prev as ModuleStatus } : m)) : cur
      )
    })
  }

  const done = modules?.filter((m) => m.status === 'done').length ?? 0
  const inProgress = modules?.filter((m) => m.status === 'in_progress').length ?? 0

  return (
    <section>
      <PageHeader
        label="Модуль 01"
        title="Курс"
        subtitle="10 модулей курса со статусами и критериями зачёта."
      />

      {error && (
        <p className="rounded border border-line border-l-2 border-l-danger bg-panel px-4 py-3 text-sm text-danger">
          Не удалось загрузить курс: {error}
        </p>
      )}
      {!modules && !error && <p className="label-mono">загрузка…</p>}

      {modules && (
        <>
          <div className="mb-6 flex items-center gap-7">
            <Stat label="всего" value={modules.length} />
            <Stat label="зачтено" value={done} accent />
            <Stat label="в работе" value={inProgress} />
          </div>

          <div className="space-y-2.5">
            {modules.map((m) => (
              <ModuleCard
                key={m.id}
                module={m}
                onStatusChange={(status) => updateStatus(m.id, status)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
