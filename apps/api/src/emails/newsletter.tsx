import { Button, Section, Text, Link } from '@react-email/components'
import { EmailLayout, colors, buttonStyle } from './email-layout'

interface NewsletterSection {
  title: string
  items: string[]
}

interface NewsletterProps {
  title: string
  subtitle: string
  sections: NewsletterSection[]
  footerText?: string
  ctaText?: string
  ctaUrl?: string
  unsubscribeUrl?: string
}

export default function Newsletter({
  title,
  subtitle,
  sections,
  footerText,
  ctaText = 'ÖPPNA FORMPLAN',
  ctaUrl = 'https://app.formplan.app',
  unsubscribeUrl = 'https://app.formplan.app/mer/installningar',
}: NewsletterProps) {
  return (
    <EmailLayout preview={title}>
      <Section style={{ padding: '40px 40px 0', textAlign: 'center' }}>
        <Text style={{ color: colors.textPrimary, fontSize: '24px', fontWeight: '700', margin: '0 0 8px' }}>
          {title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: '15px', margin: '0 0 32px' }}>
          {subtitle}
        </Text>
      </Section>

      <Section style={{ padding: '0 40px 24px' }}>
        {sections.map((section, i) => (
          <div key={i} style={{ backgroundColor: '#0F2040', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1.5px solid ${colors.brand}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Text style={{ fontSize: '16px', margin: 0, lineHeight: '36px', textAlign: 'center', width: '36px' }}>
                  {i === 0 ? '⭐' : '🔧'}
                </Text>
              </div>
              <Text style={{ color: colors.textPrimary, fontSize: '15px', fontWeight: '700', margin: 0 }}>
                {section.title}
              </Text>
            </div>
            {section.items.map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                <Text style={{ color: colors.brand, fontSize: '14px', margin: 0, lineHeight: '20px' }}>✓</Text>
                <Text style={{ color: colors.textSecondary, fontSize: '14px', margin: 0, lineHeight: '20px' }}>{item}</Text>
              </div>
            ))}
          </div>
        ))}
      </Section>

      {footerText && (
        <Section style={{ padding: '0 40px 24px' }}>
          <Text style={{ color: colors.textSecondary, fontSize: '14px', margin: 0, lineHeight: '1.7', textAlign: 'center' }}>
            {footerText}
          </Text>
        </Section>
      )}

      <Section style={{ padding: '0 40px 16px', textAlign: 'center' }}>
        <Button href={ctaUrl} style={{ ...buttonStyle, width: '100%', boxSizing: 'border-box' }}>
          {ctaText}
        </Button>
      </Section>

      <Section style={{ padding: '0 40px 24px', textAlign: 'center' }}>
        <Text style={{ color: colors.textMuted, fontSize: '12px', margin: 0 }}>
          Vill du inte ha dessa mail?{' '}
          <Link href={unsubscribeUrl} style={{ color: colors.brand }}>Avregistrera nyhetsbrev</Link>
        </Text>
      </Section>
    </EmailLayout>
  )
}
