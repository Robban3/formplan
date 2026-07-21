import { Button, Section, Text } from '@react-email/components'
import { EmailLayout, colors, buttonStyle } from './email-layout'

const perks = [
  'Personligt tränings- och kostschema',
  'AI-coach som svarar på dina frågor',
  'Fotoanalys av måltider',
  'Full statistik och progression',
]

export default function TrialEndingEmail({
  firstName,
  daysLeft,
}: {
  firstName: string
  daysLeft: number
}) {
  const dayWord = daysLeft === 1 ? 'dag' : 'dagar'
  return (
    <EmailLayout preview={`Din provperiod tar snart slut — ${daysLeft} ${dayWord} kvar`}>
      <Section style={{ padding: '40px 40px 32px', textAlign: 'center' }}>
        {/* Hourglass / clock icon */}
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: `2px solid ${colors.brand}`, margin: '0 auto 28px' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="16" stroke={colors.brand} strokeWidth="1.5" fill="none" />
            <path d="M36 27v9l6 4" stroke={colors.brand} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <Text style={{ color: colors.textPrimary, fontSize: '24px', fontWeight: '700', margin: '0 0 16px' }}>
          Din provperiod tar snart slut
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: '15px', margin: '0 0 8px', lineHeight: '1.7' }}>
          Hej{firstName ? ` ${firstName}` : ''}! Du har <strong style={{ color: colors.brand }}>{daysLeft} {dayWord}</strong> kvar av din
          gratis provperiod. Vill du fortsätta din resa utan avbrott blir du Premium på under en minut.
        </Text>
      </Section>

      <Section style={{ padding: '0 40px 32px' }}>
        <Text style={{ color: colors.textSecondary, fontSize: '14px', margin: '0 0 16px' }}>
          Med Premium behåller du:
        </Text>
        {perks.map((perk) => (
          <div key={perk} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: colors.statBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.brand, fontSize: '13px', fontWeight: '700', margin: 0, lineHeight: '20px', textAlign: 'center', width: '20px' }}>✓</Text>
            </div>
            <Text style={{ color: colors.textSecondary, fontSize: '14px', margin: '0', lineHeight: '1.4' }}>{perk}</Text>
          </div>
        ))}

        <Text style={{ color: colors.textPrimary, fontSize: '15px', fontWeight: '600', margin: '24px 0 24px', textAlign: 'center' }}>
          99 kr/mån — avsluta när du vill
        </Text>

        <Button href="https://app.formplan.app/mer" style={{ ...buttonStyle, width: '100%', boxSizing: 'border-box' }}>
          BLI PREMIUM
        </Button>
      </Section>
    </EmailLayout>
  )
}
