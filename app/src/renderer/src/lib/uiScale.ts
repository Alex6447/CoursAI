// Масштаб интерфейса. Храним локально на устройстве (это UI-настройка, не прогресс,
// поэтому не идёт в SQLite). Применяем через CSS `zoom` на корне документа — в Electron
// (Chromium) это масштабирует весь UI как браузерный зум, включая фиксированные px-размеры.
const KEY = 'coursai:ui-scale'

// Границы масштаба в процентах. Ниже 80% всё нечитаемо, выше 250% ломается раскладка.
export const MIN_SCALE = 0.8
export const MAX_SCALE = 2.5

// Быстрые пресеты для одного клика; свободный ввод доступен в любом значении диапазона.
export const UI_SCALE_PRESETS = [1, 1.25, 1.5, 2] as const

export function clampScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

export function getScale(): number {
  const raw = localStorage.getItem(KEY)
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? clampScale(n) : 1
}

export function applyScale(scale: number): void {
  document.documentElement.style.setProperty('zoom', String(clampScale(scale)))
}

export function setScale(scale: number): void {
  const s = clampScale(scale)
  localStorage.setItem(KEY, String(s))
  applyScale(s)
}
