import { Button, Section, Text } from '@react-email/components'
import { EmailLayout, colors, buttonStyle } from './email-layout'

export default function MagicLinkEmail({ loginUrl }: { loginUrl: string }) {
  return (
    <EmailLayout preview="Din inloggningslänk till FormPlan">
      <Section style={{ padding: '40px 40px 32px', textAlign: 'center' }}>
        {/* Lock icon */}
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: `2px solid ${colors.brand}`, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.brand} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <Text style={{ color: colors.textPrimary, fontSize: '24px', fontWeight: '700', margin: '0 0 12px' }}>
          Logga in på FormPlan
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: '15px', margin: '0 0 32px', lineHeight: '1.6' }}>
          Klicka på knappen nedan för att logga in på ditt konto.
        </Text>

        <Button href={loginUrl} style={{ ...buttonStyle, width: '100%', boxSizing: 'border-box' }}>
          LOGGA IN PÅ FORMPLAN
        </Button>

        <Text style={{ color: colors.textMuted, fontSize: '13px', margin: '20px 0 0' }}>
          Länken är giltig i 60 minuter.
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: '13px', margin: '12px 0 0' }}>
          Om du inte begärde denna inloggning kan du ignorera detta mejl.
        </Text>
      </Section>
    </EmailLayout>
  )
}
