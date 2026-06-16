import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Главная', code: '00', end: true },
  { to: '/course', label: 'Курс', code: '01' },
  { to: '/practice', label: 'Практика', code: '02' },
  { to: '/backlog', label: '90 дней', code: '03' },
  { to: '/mvp', label: 'RAG MVP', code: '04' },
  { to: '/settings', label: 'Настройки', code: '05' },
  { to: '/readme', label: 'README', code: '06' }
]

export default function Sidebar({
  collapsed,
  onToggle
}: {
  collapsed: boolean
  onToggle: () => void
}): JSX.Element {
  return (
    <nav className="flex h-full flex-col border-r border-line bg-panel">
      <div
        className={`flex items-center py-5 ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
            <span className="font-mono text-[15px] font-medium tracking-[0.14em] text-text">
              CoursAI
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:bg-white/[0.05] hover:text-text"
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {!collapsed && <div className="label-mono px-5 pb-2 pt-2">Навигация</div>}

      <ul className={`flex flex-col gap-0.5 ${collapsed ? 'px-2 pt-2' : 'px-3'}`}>
        {links.map((l) => (
          <li key={l.to}>
            <NavLink
              to={l.to}
              end={l.end}
              title={collapsed ? l.label : undefined}
              className={({ isActive }) =>
                [
                  'group relative flex items-center rounded py-2 text-sm transition-colors',
                  collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                  isActive ? 'bg-panel-2' : 'hover:bg-white/[0.03]'
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-accent transition-opacity',
                      isActive ? 'opacity-100 shadow-glow' : 'opacity-0'
                    ].join(' ')}
                  />
                  <span
                    className={`font-mono text-[11px] ${
                      isActive ? 'text-accent' : 'text-muted group-hover:text-text'
                    }`}
                  >
                    {l.code}
                  </span>
                  {!collapsed && (
                    <span className={isActive ? 'text-text' : 'text-muted group-hover:text-text'}>
                      {l.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {!collapsed && (
        <div className="mt-auto px-5 py-4 text-[11px] text-muted">
          <div className="label-mono mb-1">Версия</div>
          <span className="font-mono">0.1.0 · dev</span>
        </div>
      )}
    </nav>
  )
}
