import { useState } from 'react'
import { ShoppingCartIcon, CheckIcon } from '../ui/Icons'
import { useT } from '../../hooks/useT'
import { toast } from '../../lib/toast'
import {
  addRecipeToShoppingList,
  getAddedRecipes,
  isRecipeAdded,
  removeAddedRecipe,
} from '../../lib/recipeShoppingStore'

/**
 * Knappen som tar ett recept till inköpslistan.
 *
 * Ligger i en egen komponent eftersom den behövs på TRE ställen — receptsidan,
 * receptdetaljen och måltidsgeneratorn. Tre kopior av samma tillstånd (är
 * receptet tillagt?) är tre ställen där knappen kan visa fel.
 *
 * Tillståndet läses en gång vid montering och hålls sedan lokalt. Lagret
 * ligger i localStorage utan prenumeration, så en annan flik syns inte — men
 * samma recept läggs till idempotent (namnet ersätter), så det värsta som kan
 * hända är att knappen visar fel tills sidan laddas om.
 */
export function AddToShoppingList({
  name,
  ingredients,
}: {
  name: string
  ingredients: readonly string[]
}) {
  const { t } = useT()
  const [added, setAdded] = useState(() => isRecipeAdded(name))

  // Ett recept utan ingredienser går inte att handla efter.
  if (ingredients.length === 0) return null

  function toggle() {
    if (added) {
      const entry = getAddedRecipes().find((r) => r.name === name)
      if (entry) removeAddedRecipe(entry.id)
      setAdded(false)
      toast.info(t('recipes.removedFromShoppingList'))
      return
    }
    addRecipeToShoppingList(name, ingredients)
    setAdded(true)
    toast.success(t('recipes.addedToShoppingList'))
  }

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-colors ${
        added
          ? 'border border-forest-300 dark:border-forest-700 text-forest-800 dark:text-forest-300'
          : 'bg-forest-700 hover:bg-forest-800 text-white'
      }`}
    >
      {added ? (
        <CheckIcon className="w-4 h-4 stroke-forest-700 dark:stroke-forest-300" />
      ) : (
        <ShoppingCartIcon className="w-4 h-4 stroke-white" />
      )}
      {added ? t('recipes.inShoppingList') : t('recipes.addToShoppingList')}
    </button>
  )
}
