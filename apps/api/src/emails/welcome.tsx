import { Button, Section, Text } from '@react-email/components'
import { EmailLayout, colors, buttonStyle } from './email-layout'

const steps = [
  'Sätt ditt mål',
  'Fyll i din profil',
  'Skapa ditt första träningsschema',
  'Logga dagens måltider',
]

export default function WelcomeEmail({ firstName }: { firstName: string }) {
  return (
    <EmailLayout preview={`Välkommen till FormPlan, ${firstName}!`}>
      <Section style={{ padding: '40px 40px 32px', textAlign: 'center' }}>
        {/* Person icon */}
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: `2px solid ${colors.brand}`, margin: '0 auto 28px' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="28" r="10" stroke={colors.brand} strokeWidth="1.5" fill="none"/>
            <path d="M16 56c0-11 9-18 20-18s20 7 20 18" stroke={colors.brand} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </svg>
        </div>

        <Text style={{ color: colors.textPrimary, fontSize: '24px', fontWeight: '700', margin: '0 0 16px' }}>
          Välkommen till FormPlan{firstName ? `, ${firstName}` : ''}!
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: '15px', margin: '0 0 8px', lineHeight: '1.7', textAlign: 'left' }}>
          Ditt konto är nu aktivt och du kan börja bygga din personliga träningsresa.
        </Text>
      </Section>

      <Section style={{ padding: '0 40px 32px' }}>
        <Text style={{ color: colors.textSecondary, fontSize: '14px', margin: '0 0 16px' }}>
          För att komma igång rekommenderar vi att du:
        </Text>
        {steps.map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `1.5px solid ${colors.brand}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.brand, fontSize: '12px', fontWeight: '700', margin: 0, lineHeight: '24px', textAlign: 'center', width: '24px' }}>{i + 1}</Text>
            </div>
            <Text style={{ color: colors.textSecondary, fontSize: '14px', margin: '3px 0 0', lineHeight: '1.5' }}>{step}</Text>
          </div>
        ))}

        <Text style={{ color: colors.textSecondary, fontSize: '14px', margin: '24px 0 32px', lineHeight: '1.7' }}>
          Ju mer information du ger FormPlan, desto bättre kan vi anpassa dina tränings- och kostplaner.
        </Text>

        <Button href="https://app.formplan.app" style={{ ...buttonStyle, width: '100%', boxSizing: 'border-box' }}>
          ÖPPNA FORMPLAN
        </Button>
      </Section>
    </EmailLayout>
  )
}
