import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components'

export const colors = {
  bg: '#061226',
  card: '#0B1830',
  border: '#1C2A45',
  brand: '#22E6C6',
  textPrimary: '#FFFFFF',
  textSecondary: '#8EA3C0',
  textMuted: '#6F819A',
  statBg: '#0F2040',
}

export const buttonStyle = {
  backgroundColor: colors.brand,
  color: '#061226',
  padding: '14px 32px',
  borderRadius: '10px',
  fontWeight: '700',
  fontSize: '14px',
  letterSpacing: '0.5px',
  textDecoration: 'none',
  display: 'inline-block',
  textAlign: 'center' as const,
}

export function EmailLayout({
  preview,
  children,
}: {
  preview: string
  children: React.ReactNode
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.bg, fontFamily: 'Inter, -apple-system, Arial, sans-serif', margin: 0, padding: '40px 0' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden' }}>
          {/* Header */}
          <Section style={{ padding: '32px 40px 24px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>
            <Img src="https://app.formplan.app/logo.png" alt="FormPlan" height={48} style={{ margin: '0 auto' }} />
            <Text style={{ color: colors.textSecondary, fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '8px 0 0' }}>
              Tränings- &amp; kostschema
            </Text>
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Section style={{ padding: '24px 40px', borderTop: `1px solid ${colors.border}`, textAlign: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>FormPlan</Text>
            <Text style={{ color: colors.textMuted, fontSize: '12px', margin: '0 0 12px' }}>Träna smartare, inte hårdare.</Text>
            <Link href="https://app.formplan.app" style={{ color: colors.brand, fontSize: '12px' }}>Öppna appen</Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
