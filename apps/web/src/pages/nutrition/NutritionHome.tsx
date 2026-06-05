import { Routes, Route, Navigate } from 'react-router-dom'
import { FoodDiary } from './FoodDiary'
import { FoodSearch } from './FoodSearch'
import { WaterPage } from './WaterPage'
import { MacroPage } from './MacroPage'
import { CreateMealPage } from './CreateMealPage'

export function NutritionHome() {
  return (
    <Routes>
      <Route index element={<FoodDiary />} />
      <Route path="sok" element={<FoodSearch />} />
      <Route path="vatten" element={<WaterPage />} />
      <Route path="makro" element={<MacroPage />} />
      <Route path="skapa-maltid" element={<CreateMealPage />} />
      <Route path="*" element={<Navigate to="/kost" replace />} />
    </Routes>
  )
}
