-- Migration: body_measurement table for the measurements API (/measurements).
-- Run once against an existing database (idempotent apart from the policy).

create table if not exists body_measurement (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  measured_on date not null,
  weight_kg   numeric(5,1),
  waist_cm    numeric(5,1),
  chest_cm    numeric(5,1),
  hips_cm     numeric(5,1),
  arm_cm      numeric(5,1),
  thigh_cm    numeric(5,1),
  created_at  timestamptz not null default now()
);

alter table body_measurement enable row level security;

drop policy if exists "owner" on body_measurement;
create policy "owner" on body_measurement using (auth.uid() = user_id);

create index if not exists body_measurement_user_date_idx on body_measurement(user_id, measured_on desc);
