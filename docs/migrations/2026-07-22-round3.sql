-- Migration round 3 (2026-07-22): användarsatta näringsmål + starkare
-- idempotens för Stripe-webhooken. Kör en gång mot en befintlig databas
-- (idempotent).

-- 1) fitness_profile.protein_goal: användarens uttryckliga proteinmål.
--    När det (eller calorie_goal) är satt överstyr det det planhärledda målet i
--    kostloggen (getGoals/resolveDailyGoals) — uttrycklig användarintention vinner.
alter table fitness_profile add column if not exists protein_goal int;

-- 2) subscriptions.last_event_id: Stripe event.id för den senast tillämpade
--    webhook-händelsen. Används som idempotensnyckel så en omleverans av exakt
--    samma händelse inte tillämpas två gånger. Ordningsvakten på last_event_at
--    använder nu strikt ">" (inte ">="), så två olika händelser med samma
--    event.created-sekund inte längre tappas — event.id skiljer genuina
--    dubbletter från två skilda händelser samma sekund.
alter table subscriptions add column if not exists last_event_id text;
