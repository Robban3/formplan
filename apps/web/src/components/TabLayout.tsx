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
import { RecipeDetailPage } from '../pages/RecipeDetailPage'
import { MealPlanPage } from '../pages/nutrition/MealPlanPage'
import { MeasurementsPage } from '../pages/MeasurementsPage'
import { ChallengesPage } from '../pages/ChallengesPage'
import { AiCoachPage } from '../pages/AiCoachPage'
import { MealWeekPage } from '../pages/nutrition/MealWeekPage'
import { ShoppingListPage } from '../pages/nutrition/ShoppingListPage'
import { FoodPhotoPage } from '../pages/nutrition/FoodPhotoPage'
import { BarcodeScanPage } from '../pages/nutrition/BarcodeScanPage'
import { CustomWorkoutPage } from '../pages/training/CustomWorkoutPage'
import { FoodDiary } from '../pages/nutrition/FoodDiary'
import { WaterPage } from '../pages/nutrition/WaterPage'
import { FoodSearch } from '../pages/nutrition/FoodSearch'
import { useT } from '../hooks/useT'
import type { TextKey } from '../lib/i18n'

// Sökvägarna är svenska och ändras inte — de ligger i delade länkar och i
// Universal Links. Bara etiketten översätts.
const tabs: { to: string; key: TextKey; Icon: React.ComponentType<{ className?: string }> }[] = [
  { to: '/hem',     key: 'nav.home',      Icon: HomeIcon },
  { to: '/kost',    key: 'nav.nutrition', Icon: LeafIcon },
  { to: '/traning', key: 'nav.training',  Icon: DumbbellIcon },
  { to: '/analys',  key: 'nav.analytics', Icon: BarChartIcon },
  { to: '/mer',     key: 'nav.more',      Icon: MoreHorizontalIcon },
]

export function TabLayout() {
  const { t } = useT()
  return (
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto">
      {/* Page content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <Routes>
          <Route path="/hem"            element={<HomePage />} />
          <Route path="/kost/*"             element={<NutritionHome />} />
          <Route path="/kost/dagbok"        element={<FoodDiary />} />
          <Route path="/kost/vatten"        element={<WaterPage />} />
          <Route path="/kost/sok"           element={<FoodSearch />} />
          <Route path="/kost/kostschema"    element={<MealPlanPage />} />
          <Route path="/kost/veckoplan"     element={<MealWeekPage />} />
          <Route path="/kost/inkopslista"   element={<ShoppingListPage />} />
          <Route path="/kost/foto"          element={<FoodPhotoPage />} />
          <Route path="/kost/skanna"        element={<BarcodeScanPage />} />
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
          <Route path="/mer/recept/:id"     element={<RecipeDetailPage />} />
          <Route path="/mer/matningar"      element={<MeasurementsPage />} />
          <Route path="/mer/utmaningar"     element={<ChallengesPage />} />
          <Route path="/mer/ai-coach"       element={<AiCoachPage />} />
          <Route path="*"               element={<Navigate to="/hem" replace />} />
        </Routes>
      </div>

      {/* Bottom tab bar */}
      <nav className="flex-shrink-0 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 safe-bottom">
        <div className="flex">
          {tabs.map(({ to, key, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-forest-800 dark:text-forest-400' : 'text-stone-500 dark:text-stone-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-forest-600' : 'stroke-stone-500 dark:stroke-stone-400'}`} />
                  {t(key)}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
