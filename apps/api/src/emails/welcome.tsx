import { Button, Text } from '@react-email/components'
import { EmailLayout, buttonStyle } from './email-layout'

export default function WelcomeEmail({ firstName }: { firstName: string }) {
  return (
    <EmailLayout preview="Välkommen till FormPlan" title={`Välkommen ${firstName}`}>
      <Text style={{ color: '#D6E1F0' }}>Ditt konto är nu aktivt. Du kan nu:</Text>
      <Text style={{ color: '#D6E1F0' }}>• Skapa AI-genererade träningsprogram</Text>
      <Text style={{ color: '#D6E1F0' }}>• Följa kalorier och makron</Text>
      <Text style={{ color: '#D6E1F0' }}>• Se din utveckling över tid</Text>
      <Button href="https://app.formplan.app" style={buttonStyle}>Öppna FormPlan</Button>
    </EmailLayout>
  )
}
