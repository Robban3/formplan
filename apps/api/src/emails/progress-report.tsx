import { Button, Heading, Section, Text } from '@react-email/components'
import { EmailLayout, buttonStyle } from './email-layout'

const metricLabel = { color: '#8EA3C0', fontSize: '13px', margin: '0 0 4px' }
const metricValue = { color: '#22E6C6', fontSize: '36px', margin: '0 0 16px', fontWeight: '800' as const }

export default function ProgressReport({
  workouts,
  weightChange,
  streak,
}: {
  workouts: number
  weightChange: number | null
  streak: number
}) {
  return (
    <EmailLayout preview="Din veckorapport" title="Din utveckling den här veckan">
      <Section style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div>
          <Text style={metricLabel}>Träningspass</Text>
          <Heading style={metricValue}>{workouts}</Heading>
        </div>
        {weightChange !== null && (
          <div>
            <Text style={metricLabel}>Viktförändring</Text>
            <Heading style={metricValue}>{weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg</Heading>
          </div>
        )}
        <div>
          <Text style={metricLabel}>Streak</Text>
          <Heading style={metricValue}>{streak} dagar</Heading>
        </div>
      </Section>
      <Button href="https://app.formplan.app/analys" style={buttonStyle}>Visa full rapport</Button>
    </EmailLayout>
  )
}
