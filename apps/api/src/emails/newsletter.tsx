import { Button, Text } from '@react-email/components'
import { EmailLayout, buttonStyle } from './email-layout'

export default function Newsletter({ title, content }: { title: string; content: string }) {
  return (
    <EmailLayout preview={title} title={title}>
      <Text style={{ color: '#D6E1F0', whiteSpace: 'pre-wrap' }}>{content}</Text>
      <Button href="https://app.formplan.app" style={buttonStyle}>Öppna FormPlan</Button>
    </EmailLayout>
  )
}
