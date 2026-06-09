import { Button, Section, Text } from '@react-email/components'
import { EmailLayout, colors, buttonStyle } from './email-layout'

const features = [
  'Skapa personliga träningsprogram',
  'Följa dina kalorier och makron',
  'Se din utveckling över tid',
  'Få hjälp av din AI-coach',
]

export default function VerifyEmail({ verifyUrl }: { verifyUrl: string }) {
  return (
    <EmailLayout preview="Bekräfta din e-postadress för FormPlan">
      <Section style={{ padding: '40px 40px 32px', textAlign: 'center' }}>
        {/* Envelope icon */}
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: `2px solid ${colors.brand}`, margin: '0 auto 28px' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <rect width="72" height="72" rx="36" fill="none"/>
            <rect x="16" y="24" width="40" height="28" rx="3" stroke={colors.brand} strokeWidth="1.5" fill="none"/>
            <path d="M16 27l20 14 20-14" stroke={colors.brand} strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="52" cy="44" r="8" fill={colors.brand}/>
            <path d="M48.5 44l2.5 2.5 4-4" stroke="#061226" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <Text style={{ color: colors.textPrimary, fontSize: '24px', fontWeight: '700', margin: '0 0 12px' }}>
          Bekräfta din e-postadress
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: '15px', margin: '0 0 32px', lineHeight: '1.6' }}>
          Bekräfta din e-postadress för att aktivera ditt FormPlan-konto.
        </Text>

        <Button href={verifyUrl} style={{ ...buttonStyle, width: '100%', boxSizing: 'border-box' }}>
          BEKRÄFTA E-POSTADRESS
        </Button>
      </Section>

      <Section style={{ padding: '0 40px 32px' }}>
        <Text style={{ color: colors.textPrimary, fontSize: '14px', fontWeight: '600', margin: '0 0 16px' }}>
          När du är klar kan du:
        </Text>
        {features.map((f) => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.brand} strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 5v14M18 5v14M6 12h12M4 7h4M16 7h4M4 17h4M16 17h4"/>
            </svg>
            <Text style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>{f}</Text>
          </div>
        ))}
      </Section>
    </EmailLayout>
  )
}
