import { parseIngredient, type ParsedIngredient } from './recipeIngredients'

/**
 * Recept som lagts till i inköpslistan.
 *
 * Varför ett eget lager: AI-genererade recept sparas inte någonstans — de
 * finns bara i komponentens state tills man lämnar sidan. Lade man till ett i
 * inköpslistan utan att spara ingredienserna här vore de borta nästa gång
 * listan öppnades.
 *
 * Posterna grupperas PER RECEPT, inte som en platt lista. Det är enda sättet
 * att kunna ångra ett helt recept: ändrar man sig om middagen vill man inte
 * leta upp dess åtta ingredienser bland fyrtio andra rader.
 *
 * Ingredienserna tolkas vid tillägget, inte vid visningen. Tolkningen är ren
 * och deterministisk, så resultatet blir detsamma — men att göra det en gång
 * betyder att ett recept som lagts till behåller sina mängder även om
 * parsern senare ändras. Listan man handlar efter ska inte röra sig under
 * fötterna.
 */

const KEY = 'formplan_recipe_shopping'

export interface AddedRecipe {
  id: string
  /** Receptets namn, visas som rubrik och i ångra-knappen. */
  name: string
  ingredients: ParsedIngredient[]
  addedAt: string
}

function load(): AddedRecipe[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as AddedRecipe[]
    return Array.isArray(raw) ? raw.filter((r) => r && Array.isArray(r.ingredients)) : []
  } catch {
    return []
  }
}

function save(recipes: AddedRecipe[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(recipes))
  } catch {
    /* lagring blockerad — listan får leva i minnet den här sessionen */
  }
}

export function getAddedRecipes(): AddedRecipe[] {
  return load()
}

/**
 * Lägger till ett recept. Samma recept två gånger ersätter det första i
 * stället för att dubblera mängderna — trycker man på knappen igen är det
 * nästan alltid för att man är osäker på om det tog, inte för att man vill
 * laga rätten två gånger.
 */
export function addRecipeToShoppingList(name: string, ingredients: readonly string[]): AddedRecipe {
  const entry: AddedRecipe = {
    id: crypto.randomUUID(),
    name,
    ingredients: ingredients.map(parseIngredient),
    addedAt: new Date().toISOString(),
  }
  save([...load().filter((r) => r.name !== name), entry])
  return entry
}

export function removeAddedRecipe(id: string): void {
  save(load().filter((r) => r.id !== id))
}

export function clearAddedRecipes(): void {
  save([])
}

/** Ligger receptet redan i listan? Styr om knappen säger lägg till eller ta bort. */
export function isRecipeAdded(name: string): boolean {
  return load().some((r) => r.name === name)
}
