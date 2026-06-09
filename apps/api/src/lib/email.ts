import { render } from '@react-email/render'
import MagicLinkEmail from '../emails/magic-link'
import WelcomeEmail from '../emails/welcome'
import ProgressReport from '../emails/progress-report'
import Newsletter from '../emails/newsletter'

const RESEND_API = 'https://api.resend.com/emails'
const FROM = 'FormPlan <noreply@formplan.app>'

export interface SendOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail(apiKey: string, opts: SendOptions): Promise<void> {
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      reply_to: opts.replyTo,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }
}

/* ─── Renderhjälpare ─────────────────────────────────────── */

export async function welcomeEmail(name: string): Promise<string> {
  return render(WelcomeEmail({ firstName: name }))
}

export async function progressEmail(opts: {
  name: string
  workouts: number
  volumeKg: number
  weightDelta: number | null
  streak: number
}): Promise<string> {
  return render(ProgressReport({ workouts: opts.workouts, weightChange: opts.weightDelta, streak: opts.streak }))
}

export async function magicLinkEmail(link: string): Promise<string> {
  return render(MagicLinkEmail({ loginUrl: link }))
}

export async function newsletterEmail(opts: {
  subject: string
  heading: string
  body: string
}): Promise<string> {
  return render(Newsletter({ title: opts.heading, content: opts.body }))
}
