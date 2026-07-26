// Shared number formatting so the same value never renders with a mix of "."
// and "," across screens. Swedish UI uses a comma as the decimal separator.

/** Milliliters → liters as a Swedish-formatted string WITHOUT unit, e.g. 2500 → "2,5". */
export function formatLiters(ml: number): string {
  return (ml / 1000).toFixed(1).replace('.', ',')
}

/** A one-decimal Swedish-formatted number WITHOUT unit, e.g. 75.5 → "75,5". */
export function formatKg(kg: number): string {
  return kg.toFixed(1).replace('.', ',')
}
