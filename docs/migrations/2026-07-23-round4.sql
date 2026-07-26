-- Migration round 4 (2026-07-23): idempotent vattenloggning.
-- Kör en gång mot en befintlig databas (idempotent).

-- water_log.client_id: klientens lokala post-id. Offline-flush är at-least-once
-- (ett tappat svar får klienten att re-POST:a), vilket annars skapar dubbletter.
-- Med client_id + unikt index blir en re-POST med samma id en no-op (merge).
alter table water_log add column if not exists client_id text;

-- Partiellt unikt index: bara rader med client_id omfattas, så vanliga inserts
-- utan client_id (t.ex. äldre klienter) fortsätter fungera obegränsat.
create unique index if not exists water_log_client_idx
  on water_log(user_id, client_id)
  where client_id is not null;
