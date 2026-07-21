import { render } from '@react-email/render'
import MagicLinkEmail from '../emails/magic-link'
import WelcomeEmail from '../emails/welcome'
import ProgressReport from '../emails/progress-report'
import Newsletter from '../emails/newsletter'
import TrialEndingEmail from '../emails/trial-ending'

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

export async function magicLinkEmail(loginUrl: string): Promise<string> {
  return render(MagicLinkEmail({ loginUrl }))
}

export async function verifyEmail(verifyUrl: string): Promise<string> {
  const VerifyEmail = (await import('../emails/verify-email')).default
  return render(VerifyEmail({ verifyUrl }))
}

export async function welcomeEmail(firstName: string): Promise<string> {
  return render(WelcomeEmail({ firstName }))
}

export async function trialEndingEmail(opts: {
  firstName: string
  daysLeft: number
}): Promise<string> {
  return render(TrialEndingEmail(opts))
}

export async function progressEmail(opts: {
  firstName: string
  workoutsCompleted: number
  workoutsTotal: number
  mealDaysCompleted: number
  mealDaysTotal: number
  weightChange: number | null
  calorieDeficit: number | null
  personalBests: number
  streak: number
  motivationalMessage?: string
}): Promise<string> {
  return render(ProgressReport(opts))
}

export async function newsletterEmail(opts: {
  title: string
  subtitle: string
  sections: { title: string; items: string[] }[]
  footerText?: string
  ctaText?: string
  ctaUrl?: string
}): Promise<string> {
  return render(Newsletter(opts))
}
