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
import { GoalsPage } from '../pages/GoalsPage'
import { RecipesPage } from '../pages/RecipesPage'
import { MealPlanPage } from '../pages/nutrition/MealPlanPage'
import { MeasurementsPage } from '../pages/MeasurementsPage'
import { ChallengesPage } from '../pages/ChallengesPage'
import { AiCoachPage } from '../pages/AiCoachPage'
import { MealWeekPage } from '../pages/nutrition/MealWeekPage'
import { CustomWorkoutPage } from '../pages/training/CustomWorkoutPage'
import { FoodDiary } from '../pages/nutrition/FoodDiary'
import { WaterPage } from '../pages/nutrition/WaterPage'
import { FoodSearch } from '../pages/nutrition/FoodSearch'

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
          <Route path="/kost"               element={<NutritionHome />} />
          <Route path="/kost/dagbok"        element={<FoodDiary />} />
          <Route path="/kost/vatten"        element={<WaterPage />} />
          <Route path="/kost/sok"           element={<FoodSearch />} />
          <Route path="/kost/kostschema"    element={<MealPlanPage />} />
          <Route path="/kost/veckoplan"     element={<MealWeekPage />} />
          <Route path="/traning"        element={<TrainingOverview />} />
          <Route path="/traning/:id"    element={<WorkoutDetail />} />
          <Route path="/traning/egna"   element={<CustomWorkoutPage />} />
          <Route path="/analys"         element={<AnalyticsPage />} />
          <Route path="/mer"                element={<MorePage />} />
          <Route path="/mer/profil"         element={<ProfilePage />} />
          <Route path="/mer/installningar"  element={<SettingsPage />} />
          <Route path="/mer/notiser"        element={<NotificationsPage />} />
          <Route path="/mer/paminnelser"    element={<RemindersPage />} />
          <Route path="/mer/apple-health"   element={<AppleHealthPage />} />
          <Route path="/mer/hjalp"          element={<HelpPage />} />
          <Route path="/mer/om"             element={<AboutPage />} />
          <Route path="/mer/mina-mal"       element={<GoalsPage />} />
          <Route path="/mer/recept"         element={<RecipesPage />} />
          <Route path="/mer/matningar"      element={<MeasurementsPage />} />
          <Route path="/mer/utmaningar"     element={<ChallengesPage />} />
          <Route path="/mer/ai-coach"       element={<AiCoachPage />} />
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
