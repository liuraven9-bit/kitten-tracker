import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import QuickLog from './pages/QuickLog'
import Foods from './pages/Foods'
import Charts from './pages/Charts'
import Settings from './pages/Settings'
import AddFoodByScan from './pages/AddFoodByScan'
import { Home, Plus, Database, LineChart, Cog } from './components/icons'

const tabs = [
  { to: '/dashboard', label: 'Today', icon: Home },
  { to: '/log', label: 'Log', icon: Plus },
  { to: '/foods', label: 'Foods', icon: Database },
  { to: '/charts', label: 'Charts', icon: LineChart },
  { to: '/settings', label: 'Settings', icon: Cog },
]

export default function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <main className="flex-1 px-4 pb-28 pt-5">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log" element={<QuickLog />} />
          <Route path="/foods" element={<Foods />} />
          <Route path="/foods/scan" element={<AddFoodByScan />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-sand bg-cream/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                  isActive ? 'text-moss' : 'text-ink/45'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              {label}
            </NavLink>
          ))}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  )
}
