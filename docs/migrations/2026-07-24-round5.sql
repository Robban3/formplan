-- Migration round 5 (2026-07-24): gör vattenloggens client_id-index NON-partiellt.
-- Kör en gång mot en befintlig databas (idempotent). Ersätter (supersedes) det
-- partiella indexet från round 4 (2026-07-23-round4.sql) — lämna den filen som
-- historik, men det är DETTA index som gäller.
--
-- Varför: PostgREST kan inte skicka predikatet (where client_id is not null) för
-- ett PARTIELLT unikt index till PostgreSQL. En POST med
-- on_conflict=user_id,client_id + Prefer: resolution=merge-duplicates matchar då
-- inget ON CONFLICT-mål och Postgres kastar 42P10 → VARJE client_id-vatteninsert
-- misslyckas (offline-vatten synkas aldrig). Ett totalt (icke-partiellt) unikt
-- index löser det: NULL-värden är distinkta i ett unikt index, så online-inserts
-- utan client_id förblir obegränsade.

-- Säkert oavsett om round 4 redan körts eller inte.
alter table water_log add column if not exists client_id text;
drop index if exists water_log_client_idx;
create unique index if not exists water_log_client_idx on water_log(user_id, client_id);
