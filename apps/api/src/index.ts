import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { profileRouter } from './routes/profile'
import { planRouter } from './routes/plan'
import { stripeRouter } from './routes/stripe'
import { nutritionRouter } from './routes/nutrition'
import { workoutRouter } from './routes/workout'
import { emailRouter } from './routes/email'
import { aiRouter } from './routes/ai'
import { billingRouter } from './routes/billing'
import { accountRouter } from './routes/account'
import { measurementsRouter } from './routes/measurements'
import type { Env } from './lib/types'
import { sendWeeklyReports } from './jobs/weeklyReport'

const app = new Hono<{ Bindings: Env }>()

app.use('*', logger())
app.use(
  '*',
  cors({
    // localhost tillåts bara utanför produktion (lokal utveckling/test).
    origin: (origin, c) => {
      const allowed = ['https://app.formplan.app', 'https://formplan.app']
      if (c.env.ENVIRONMENT !== 'production') allowed.push('http://localhost:5173')
      return allowed.includes(origin) ? origin : null
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

app.get('/health', (c) => c.json({ ok: true }))

app.route('/profile', profileRouter)
app.route('/plan', planRouter)
app.route('/stripe', stripeRouter)
app.route('/nutrition', nutritionRouter)
app.route('/workout', workoutRouter)
app.route('/email', emailRouter)
app.route('/ai', aiRouter)
app.route('/billing', billingRouter)
app.route('/account', accountRouter)
app.route('/measurements', measurementsRouter)

const worker = {
  fetch: app.fetch.bind(app),
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(sendWeeklyReports(env))
  },
}

export { app }
export default worker
