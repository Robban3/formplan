import { Button, Text } from '@react-email/components'
import { EmailLayout, buttonStyle } from './email-layout'

export default function VerifyEmail({ verifyUrl }: { verifyUrl: string }) {
  return (
    <EmailLayout preview="Bekräfta din e-postadress" title="Bekräfta din e-postadress">
      <Text style={{ color: '#D6E1F0' }}>Bekräfta din e-postadress för att aktivera ditt konto.</Text>
      <Button href={verifyUrl} style={buttonStyle}>Bekräfta konto</Button>
    </EmailLayout>
  )
}
