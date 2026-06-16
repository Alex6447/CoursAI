import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import {
  MAX_SCALE,
  MIN_SCALE,
  UI_SCALE_PRESETS,
  clampScale,
  getScale,
  setScale
} from '../lib/uiScale'

const MIN_PCT = Math.round(MIN_SCALE * 100)
const MAX_PCT = Math.round(MAX_SCALE * 100)

export default function Settings(): JSX.Element {
  // Работаем в процентах (целое число) — удобнее для ввода.
  const [pct, setPct] = useState(() => Math.round(getScale() * 100))

  const apply = (nextPct: number): void => {
    const clamped = Math.round(clampScale(nextPct / 100) * 100)
    setPct(clamped)
    setScale(clamped / 100)
  }

  return (
    <section>
      <PageHeader
        label="Модуль 05"
        title="Настройки"
        subtitle="Параметры интерфейса. Сохраняются локально на этом устройстве."
      />

      <div className="rounded-lg border border-line bg-panel p-5 shadow-panel">
        <div className="label-mono mb-1">Размер шрифта</div>
        <p className="mb-5 text-sm text-muted">
          Масштаб всего интерфейса, от {MIN_PCT}% до {MAX_PCT}%.
        </p>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min={MIN_PCT}
            max={MAX_PCT}
            step={5}
            value={pct}
            onChange={(e) => apply(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-panel-2 accent-accent"
          />

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={MIN_PCT}
              max={MAX_PCT}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              onBlur={(e) => apply(Number(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') apply(Number((e.target as HTMLInputElement).value))
              }}
              className="w-20 rounded border border-line bg-panel-2 px-2 py-1.5 text-right font-mono tabular-nums text-text outline-none focus:border-accent"
            />
            <span className="font-mono text-muted">%</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {UI_SCALE_PRESETS.map((s) => {
            const presetPct = Math.round(s * 100)
            const active = presetPct === pct
            return (
              <button
                key={s}
                type="button"
                onClick={() => apply(presetPct)}
                className={[
                  'rounded border px-3 py-1.5 font-mono text-sm tabular-nums transition-colors',
                  active
                    ? 'border-accent bg-accent text-bg'
                    : 'border-line bg-panel-2 text-muted hover:text-text'
                ].join(' ')}
              >
                {presetPct}%
              </button>
            )
          })}
        </div>

        <p className="mt-5 text-xs text-muted">
          Изменение применяется сразу ко всему приложению и сохраняется после перезапуска.
        </p>
      </div>
    </section>
  )
}
