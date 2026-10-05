-- Migration (2026-10-05): client_id på body_measurement för idempotent
-- offline-flush av vikt och kroppsmått. Kör en gång mot databasen (idempotent).
--
-- Varför: vikt- och måttloggen speglade till servern med
-- `measurementsApi.create(...).catch(() => {})` och gav upp vid fel. Till
-- skillnad från vattenloggen och träningspassen fanns ingen återförsökskö, så
-- en vikt loggad utan nät låg kvar i den webbläsarens localStorage för alltid —
-- borta vid byte av enhet eller ominstallation.
--
-- Flushen behöver kunna skicka om en post utan att skapa en dubblett när svaret
-- på det första försöket gick förlorat. client_id är klientens lokala post-id
-- och gör en re-POST till en no-op (merge).
--
-- Indexet är avsiktligt NON-partiellt, av exakt samma skäl som vattenloggens
-- (se 2026-07-24-round5.sql): PostgREST kan inte skicka predikatet för ett
-- PARTIELLT unikt index till ON CONFLICT, vilket ger 42P10 på varje
-- client_id-insert. NULL är distinkt i ett unikt index, så inserts utan
-- client_id förblir obegränsade.

alter table body_measurement add column if not exists client_id text;
create unique index if not exists body_measurement_client_idx
  on body_measurement(user_id, client_id);
