-- Migration round 2 (2026-07-21): audit-fixar för prenumerationer, träningspass
-- och livsmedel. Kör en gång mot en befintlig databas (idempotent).

-- 1) Subscriptions: Stripe-status + ordningsvakt för webhook-händelser.
--    status: Stripes prenumerationsstatus ('active','trialing','past_due', …).
--            isUserPremium kräver status in ('active','trialing').
--    last_event_at: Stripe event.created för den senast tillämpade webhook-
--            händelsen — API:t ignorerar händelser äldre än denna, så en
--            försenad "updated" inte kan återuppliva premium efter "deleted".
alter table subscriptions add column if not exists status text;
alter table subscriptions add column if not exists last_event_at timestamptz;

-- 2) Idempotenta träningspass: en re-POST av samma pass (samma användare,
--    starttid och passnamn) upsertas i stället för att skapa en dubblettrad.
create unique index if not exists workout_session_dedup_idx
  on workout_session (user_id, started_at, workout_name);

-- 3) Unika livsmedelsnamn (skiftlägesokänsligt). Tidigare seed-körningar kan ha
--    skapat dubbletter — rensa dem innan indexet skapas.
--    Obs: indexet heter INTE food_item_name_idx; det namnet används redan av
--    GIN-sökindexet i schemat.
delete from food_item a using food_item b
  where a.ctid > b.ctid and lower(a.name) = lower(b.name);
create unique index if not exists food_item_name_unique_idx
  on food_item ((lower(name)));
