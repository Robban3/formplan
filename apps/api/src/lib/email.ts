/**
 * Resend e-posttjänst
 * Byt bara RESEND_API_KEY i Cloudflare Worker-secrets så funkar allt.
 */

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

/* ─── E-postmallar ─────────────────────────────────────── */

const base = (content: string) => `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0d1117; padding: 32px 40px; text-align: center; }
    .header img { height: 48px; }
    .body { padding: 40px; color: #1a1a1a; }
    .body h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
    .body p { font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 16px; }
    .btn { display: inline-block; background: #22e6c6; color: #0d1117; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; margin: 8px 0 24px; }
    .stat-row { display: flex; gap: 12px; margin: 20px 0; }
    .stat { flex: 1; background: #f8f8f8; border-radius: 12px; padding: 16px; text-align: center; }
    .stat .val { font-size: 24px; font-weight: 800; color: #22e6c6; }
    .stat .lbl { font-size: 12px; color: #888; margin-top: 4px; }
    .footer { background: #0d1117; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #555; margin: 0; }
    .footer a { color: #22e6c6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://app.formplan.app/logo.png" alt="FormPlan" />
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>FormPlan &nbsp;·&nbsp; <a href="https://app.formplan.app">app.formplan.app</a></p>
      <p style="margin-top:8px"><a href="https://app.formplan.app/mer/installningar">Avsluta prenumeration</a></p>
    </div>
  </div>
</body>
</html>
`

export function welcomeEmail(name: string): string {
  return base(`
    <h1>Välkommen till FormPlan, ${name || 'du'}! 🎉</h1>
    <p>Vi är glada att du är här. FormPlan hjälper dig att nå dina träningsmål med AI-genererade scheman anpassade just för dig.</p>
    <p><strong>Kom igång på 3 minuter:</strong></p>
    <ol style="color:#444;font-size:15px;line-height:2">
      <li>Fyll i din profil &amp; dina mål</li>
      <li>Låt AI generera ditt tränings- och kostschema</li>
      <li>Logga din första träning</li>
    </ol>
    <a href="https://app.formplan.app/onboarding" class="btn">Skapa mitt schema →</a>
    <p style="font-size:13px;color:#888">Har du frågor? Svara bara på detta mail så hjälper vi dig.</p>
  `)
}

export function progressEmail(opts: {
  name: string
  workouts: number
  volumeKg: number
  weightDelta: number | null
  streak: number
}): string {
  const weightLine = opts.weightDelta !== null
    ? `<div class="stat"><div class="val">${opts.weightDelta > 0 ? '+' : ''}${opts.weightDelta.toFixed(1)} kg</div><div class="lbl">Viktutveckling</div></div>`
    : ''

  return base(`
    <h1>Din veckorapport 📊</h1>
    <p>Här är din träningssammanfattning för den senaste veckan, ${opts.name || 'champ'}!</p>
    <div class="stat-row">
      <div class="stat"><div class="val">${opts.workouts}</div><div class="lbl">Pass</div></div>
      <div class="stat"><div class="val">${Math.round(opts.volumeKg).toLocaleString('sv')}</div><div class="lbl">kg volym</div></div>
      <div class="stat"><div class="val">${opts.streak}</div><div class="lbl">Dagars streak</div></div>
      ${weightLine}
    </div>
    <a href="https://app.formplan.app/analys" class="btn">Se hela analysen →</a>
    <p style="font-size:13px;color:#888">Fortsätt så! Konsekvens är nyckeln till resultat.</p>
  `)
}

export function magicLinkEmail(link: string): string {
  return base(`
    <h1>Din inloggningslänk</h1>
    <p>Klicka på knappen nedan för att logga in på FormPlan. Länken är giltig i 60 minuter.</p>
    <a href="${link}" class="btn">Logga in på FormPlan →</a>
    <p style="font-size:13px;color:#888">Om du inte begärt detta kan du ignorera mejlet.</p>
  `)
}

export function newsletterEmail(opts: {
  subject: string
  heading: string
  body: string
  ctaText?: string
  ctaUrl?: string
}): string {
  const cta = opts.ctaText && opts.ctaUrl
    ? `<a href="${opts.ctaUrl}" class="btn">${opts.ctaText} →</a>`
    : ''
  return base(`
    <h1>${opts.heading}</h1>
    ${opts.body}
    ${cta}
  `)
}
