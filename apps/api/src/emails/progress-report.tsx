import { Button, Section, Text } from '@react-email/components'
import { EmailLayout, colors, buttonStyle } from './email-layout'

interface ProgressReportProps {
  firstName: string
  workoutsCompleted: number
  workoutsTotal: number
  mealDaysCompleted: number
  mealDaysTotal: number
  weightChange: number | null
  calorieDeficit: number | null
  personalBests: number
  streak: number
  motivationalMessage?: string
}

function StatBox({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <td style={{ width: '33%', padding: '4px' }}>
      <div style={{ backgroundColor: '#0F2040', borderRadius: '12px', padding: '16px 12px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
        <Text style={{ fontSize: '20px', margin: '0 0 4px' }}>{icon}</Text>
        <Text style={{ color: colors.textMuted, fontSize: '11px', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</Text>
        <Text style={{ color: colors.brand, fontSize: '22px', fontWeight: '800', margin: '0 0 2px' }}>{value}</Text>
        {sub && <Text style={{ color: colors.textMuted, fontSize: '11px', margin: 0 }}>{sub}</Text>}
      </div>
    </td>
  )
}

export default function ProgressReport({
  firstName,
  workoutsCompleted,
  workoutsTotal,
  mealDaysCompleted,
  mealDaysTotal,
  weightChange,
  calorieDeficit,
  personalBests,
  streak,
  motivationalMessage,
}: ProgressReportProps) {
  const weightStr = weightChange !== null
    ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`
    : '–'

  return (
    <EmailLayout preview={`Din veckorapport — ${workoutsCompleted} pass genomförda`}>
      <Section style={{ padding: '40px 40px 0', textAlign: 'center' }}>
        <Text style={{ color: colors.textPrimary, fontSize: '24px', fontWeight: '700', margin: '0 0 8px' }}>
          Din veckorapport
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: '15px', margin: '0 0 32px' }}>
          Här är din sammanfattning för veckan som gått{firstName ? `, ${firstName}` : ''}.
        </Text>
      </Section>

      <Section style={{ padding: '0 36px 24px' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <StatBox icon="🏋️" label="Träningspass" value={`${workoutsCompleted} / ${workoutsTotal}`} sub="genomförda" />
              <StatBox icon="🍽️" label="Kostmål" value={`${mealDaysCompleted} / ${mealDaysTotal}`} sub="dagar" />
              <StatBox icon="⚖️" label="Viktförändring" value={weightStr} sub="denna vecka" />
            </tr>
            <tr>
              <StatBox icon="🔥" label="Kaloriunderskott" value={calorieDeficit !== null ? `${calorieDeficit.toLocaleString('sv')}` : '–'} sub="kcal totalt" />
              <StatBox icon="🏆" label="Personbästa" value={`${personalBests}`} sub="nya rekord" />
              <StatBox icon="📈" label="Aktivitetsstreak" value={`${streak}`} sub="dagar" />
            </tr>
          </tbody>
        </table>
      </Section>

      {motivationalMessage && (
        <Section style={{ padding: '0 40px 24px' }}>
          <div style={{ backgroundColor: '#0F2040', borderRadius: '12px', padding: '16px 20px', border: `1px solid ${colors.border}`, display: 'flex', gap: '12px' }}>
            <Text style={{ fontSize: '20px', margin: 0 }}>📊</Text>
            <Text style={{ color: colors.textSecondary, fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
              {motivationalMessage}
            </Text>
          </div>
        </Section>
      )}

      <Section style={{ padding: '0 40px 40px', textAlign: 'center' }}>
        <Button href="https://app.formplan.app/analys" style={{ ...buttonStyle, width: '100%', boxSizing: 'border-box' }}>
          SE FULL RAPPORT
        </Button>
      </Section>
    </EmailLayout>
  )
}
