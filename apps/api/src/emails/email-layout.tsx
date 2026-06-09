import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export function EmailLayout({
  preview,
  title,
  children,
}: {
  preview: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#061226', fontFamily: 'Inter, Arial, sans-serif', padding: '40px 0' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#0B1830', border: '1px solid #1C2A45', borderRadius: '16px', overflow: 'hidden' }}>
          <Section style={{ padding: '40px', textAlign: 'center' }}>
            <Heading style={{ color: '#FFFFFF', fontSize: '32px', marginBottom: '8px' }}>FormPlan</Heading>
            <Text style={{ color: '#8EA3C0', fontSize: '16px' }}>Tränings- &amp; kostschema</Text>
          </Section>
          <Section style={{ padding: '0 40px 40px' }}>
            <Heading style={{ color: '#FFFFFF', fontSize: '24px' }}>{title}</Heading>
            {children}
          </Section>
          <Section style={{ padding: '24px 40px', borderTop: '1px solid #1C2A45' }}>
            <Text style={{ color: '#6F819A', fontSize: '13px', textAlign: 'center' }}>
              © FormPlan &nbsp;·&nbsp; <a href="https://app.formplan.app/mer/installningar" style={{ color: '#22E6C6' }}>Avsluta prenumeration</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const buttonStyle = {
  backgroundColor: '#22E6C6',
  color: '#061226',
  padding: '14px 28px',
  borderRadius: '10px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}
