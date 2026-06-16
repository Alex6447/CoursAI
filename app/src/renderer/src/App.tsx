import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './routes/Home'
import Course from './routes/Course'
import Practice from './routes/Practice'
import Backlog from './routes/Backlog'
import Mvp from './routes/Mvp'
import Settings from './routes/Settings'
import Readme from './routes/Readme'

const SIDEBAR_KEY = 'coursai:sidebar-collapsed'

export default function App(): JSX.Element {
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(SIDEBAR_KEY) === '1'
  )

  const toggleSidebar = (): void => {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <div
      className={`grid h-full ${
        collapsed ? 'grid-cols-[64px_1fr]' : 'grid-cols-[240px_1fr]'
      } bg-bg text-text`}
    >
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <main className="overflow-y-auto">
        <div className="mx-auto max-w-5xl px-10 py-9">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/course" element={<Course />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/backlog" element={<Backlog />} />
            <Route path="/mvp" element={<Mvp />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/readme" element={<Readme />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
