# FormPlan

AI-genererat personligt tränings- och kostschema. Monorepo med en React-PWA och
ett Cloudflare Workers-API, byggt på Supabase och Anthropic Claude.

## Arkitektur

```
apps/
  web/   React 19 + Vite + Tailwind (PWA)   – mobilförst-klient
  api/   Cloudflare Workers + Hono          – HTTP-API
docs/
  supabase-schema.sql                       – databasschema + seed
```

- **Auth & DB:** Supabase (Postgres med RLS). API:t använder service-role-nyckeln
  och verifierar användarens JWT per request.
- **AI:** Anthropic Claude genererar 7-dagars tränings-/kostscheman i bakgrunden.
- **Betalning:** Stripe-webhooks styr premium-status.

## Kom igång

```bash
npm install

# Kopiera och fyll i miljövariabler
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.local.example apps/api/.env.local

# Kör databasschemat i Supabase (SQL editor eller psql)
#   docs/supabase-schema.sql

npm run dev:web   # http://localhost:5173
npm run dev:api   # wrangler dev (http://localhost:8787)
```

## Scripts (root)

| Kommando             | Beskrivning                              |
| -------------------- | ---------------------------------------- |
| `npm run dev:web`    | Starta webbklienten                      |
| `npm run dev:api`    | Starta API:t lokalt (wrangler)           |
| `npm run build`      | Produktionsbygg av webben                |
| `npm run typecheck`  | Typkontroll av alla workspaces           |
| `npm test`           | Kör enhetstester (vitest)                |
| `npm run lint`       | Lint (web)                               |

## API-endpoints

| Metod    | Väg                          | Beskrivning                          |
| -------- | ---------------------------- | ------------------------------------ |
| `GET`    | `/profile`                   | Hämta fitnessprofil                  |
| `POST`   | `/profile`                   | Skapa/uppdatera profil               |
| `POST`   | `/plan/generate`             | Generera nytt schema (async)         |
| `GET`    | `/plan/list`                 | Lista användarens scheman            |
| `GET`    | `/plan/:id`                  | Hämta schema med dagar               |
| `GET`    | `/nutrition/foods/search`    | Sök i matdatabasen                   |
| `GET`    | `/nutrition/log?date=`       | Dagens matlogg + mål                 |
| `POST`   | `/nutrition/log`             | Logga måltid                         |
| `DELETE` | `/nutrition/log/:id`         | Ta bort måltid                       |
| `GET`    | `/nutrition/water?date=`     | Dagens vattenintag                   |
| `POST`   | `/nutrition/water`           | Logga vatten                         |
| `DELETE` | `/nutrition/water/:id`       | Ta bort vattenpost                   |
| `POST`   | `/workout/session`           | Spara genomfört pass                 |
| `GET`    | `/workout/sessions`          | Lista pass (för statistik)           |
| `POST`   | `/stripe/webhook`            | Stripe-prenumerationswebhook         |

## Tester & CI

Rena hjälpfunktioner (svårighetsgrad, makromål, vecko-aggregering) täcks av
vitest. GitHub Actions kör typkontroll, tester och bygg på varje PR
(se `.github/workflows/ci.yml`).
