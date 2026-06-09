import { Button, Text } from '@react-email/components'
import { EmailLayout, buttonStyle } from './email-layout'

export default function MagicLinkEmail({ loginUrl }: { loginUrl: string }) {
  return (
    <EmailLayout preview="Logga in på FormPlan" title="Logga in på FormPlan">
      <Text style={{ color: '#D6E1F0' }}>Klicka på knappen nedan för att logga in på ditt konto.</Text>
      <Button href={loginUrl} style={buttonStyle}>Logga in</Button>
      <Text style={{ color: '#8EA3C0' }}>Länken är giltig i 60 minuter.</Text>
    </EmailLayout>
  )
}
