import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { HomeIcon, LeafIcon, DumbbellIcon, BarChartIcon, MoreHorizontalIcon } from './ui/Icons'
import { HomePage } from '../pages/home/HomePage'
import { TrainingOverview } from '../pages/training/TrainingOverview'
import { WorkoutDetail } from '../pages/training/WorkoutDetail'
import { NutritionHome } from '../pages/nutrition/NutritionHome'
import { AnalyticsPage } from '../pages/AnalyticsPage'
import { MorePage } from '../pages/MorePage'
import { ProfilePage } from '../pages/ProfilePage'
import { AboutPage } from '../pages/AboutPage'
import { SettingsPage } from '../pages/SettingsPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { RemindersPage } from '../pages/RemindersPage'
import { AppleHealthPage } from '../pages/AppleHealthPage'
import { HelpPage } from '../pages/HelpPage'

const tabs = [
  { to: '/hem',      label: 'Hem',      Icon: HomeIcon },
  { to: '/kost',     label: 'Kost',     Icon: LeafIcon },
  { to: '/traning',  label: 'Träning',  Icon: DumbbellIcon },
  { to: '/analys',   label: 'Analys',   Icon: BarChartIcon },
  { to: '/mer',      label: 'Mer',      Icon: MoreHorizontalIcon },
]

export function TabLayout() {
  return (
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto">
      {/* Page content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <Routes>
          <Route path="/hem"            element={<HomePage />} />
          <Route path="/kost/*"         element={<NutritionHome />} />
          <Route path="/traning"        element={<TrainingOverview />} />
          <Route path="/traning/:id"    element={<WorkoutDetail />} />
          <Route path="/analys"         element={<AnalyticsPage />} />
          <Route path="/mer"                element={<MorePage />} />
          <Route path="/mer/profil"         element={<ProfilePage />} />
          <Route path="/mer/installningar"  element={<SettingsPage />} />
          <Route path="/mer/notiser"        element={<NotificationsPage />} />
          <Route path="/mer/paminnelser"    element={<RemindersPage />} />
          <Route path="/mer/apple-health"   element={<AppleHealthPage />} />
          <Route path="/mer/hjalp"          element={<HelpPage />} />
          <Route path="/mer/om"             element={<AboutPage />} />
          <Route path="*"               element={<Navigate to="/hem" replace />} />
        </Routes>
      </div>

      {/* Bottom tab bar */}
      <nav className="flex-shrink-0 bg-white border-t border-stone-200 safe-bottom">
        <div className="flex">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-forest-600' : 'text-stone-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-forest-600' : 'stroke-stone-400'}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
