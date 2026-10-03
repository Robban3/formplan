import { describe, it, expect } from 'vitest'
import { planAdjustmentForGoal } from './goalPlan'
import type { GoalMeta } from './goalTracker'

const meta = (type: GoalMeta['type'], targetValue = 0, unit = ''): GoalMeta => ({
  type,
  targetValue,
  unit,
})

describe('planAdjustmentForGoal', () => {
  it('gör "Gå ner 5 kg" till viktnedgång', () => {
    const adj = planAdjustmentForGoal(meta('weight_loss', 5, 'kg'), 80)
    expect(adj?.patch).toEqual({ goal: 'lose_weight' })
  })

  it('läser riktningen på ett viktmål ur nuvarande vikt', () => {
    expect(planAdjustmentForGoal(meta('weight_target', 75, 'kg'), 80)?.patch).toEqual({
      goal: 'lose_weight',
    })
    expect(planAdjustmentForGoal(meta('weight_target', 85, 'kg'), 80)?.patch).toEqual({
      goal: 'build_muscle',
    })
    // Nära nog målvikten redan — då är det inte upp eller ner, utan hålla.
    expect(planAdjustmentForGoal(meta('weight_target', 80.2, 'kg'), 80)?.patch).toEqual({
      goal: 'maintain',
    })
  })

  // Utan vikt går riktningen inte att avgöra. Att gissa vore värre än att låta
  // bli: fel gissning bygger om hela schemat åt fel håll.
  it('erbjuder ingen anpassning för viktmål utan känd vikt', () => {
    expect(planAdjustmentForGoal(meta('weight_target', 75, 'kg'), null)).toBeNull()
    expect(planAdjustmentForGoal(meta('weight_target', 75, 'kg'), NaN)).toBeNull()
  })

  it('gör "Träna 4 gånger i veckan" till fyra träningsdagar', () => {
    expect(planAdjustmentForGoal(meta('training_weekly', 4, 'pass/vecka'), 80)?.patch).toEqual({
      days_per_week: 4,
    })
  })

  // Profilen tillåter 1–7 dagar. Ett orimligt mål får inte skicka en profil
  // som API:t avvisar med 400.
  it('avvisar ett orimligt antal träningsdagar', () => {
    expect(planAdjustmentForGoal(meta('training_weekly', 0), 80)).toBeNull()
    expect(planAdjustmentForGoal(meta('training_weekly', 9), 80)).toBeNull()
  })

  it('erbjuder ingen anpassning för mål som inte säger något om upplägget', () => {
    expect(planAdjustmentForGoal(meta('water_daily', 2500, 'ml/dag'), 80)).toBeNull()
    expect(planAdjustmentForGoal(meta('training_total', 50, 'pass'), 80)).toBeNull()
    expect(planAdjustmentForGoal(meta('manual'), 80)).toBeNull()
    expect(planAdjustmentForGoal(undefined, 80)).toBeNull()
  })

  it('beskriver vad som ändras, för bekräftelsen', () => {
    const adj = planAdjustmentForGoal(meta('weight_loss', 5, 'kg'), 80)
    expect(adj?.description).toContain('Gå ner i vikt')
  })
})
