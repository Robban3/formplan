import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { profileRouter } from './routes/profile'
import { planRouter } from './routes/plan'
import { stripeRouter } from './routes/stripe'
import { nutritionRouter } from './routes/nutrition'
import { workoutRouter } from './routes/workout'
import { emailRouter } from './routes/email'
import type { Env } from './lib/types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) =>
      ['https://app.formplan.app', 'https://formplan.app', 'http://localhost:5173'].includes(
        origin
      )
        ? origin
        : null,
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

export default app
