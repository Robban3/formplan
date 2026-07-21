-- FormPlan database schema

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Fitness profile (1 per user, upserted)
create table if not exists fitness_profile (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  goal        text not null check (goal in ('lose_weight','build_muscle','maintain','improve_endurance')),
  level       text not null check (level in ('beginner','intermediate','advanced')),
  equipment   text[] not null default '{}',
  days_per_week int not null check (days_per_week between 1 and 7),
  allergies   text[] not null default '{}',
  calorie_goal int,
  age         int,
  weight_kg   numeric(5,1),
  height_cm   numeric(5,1),
  updated_at  timestamptz not null default now()
);

alter table fitness_profile enable row level security;
create policy "owner" on fitness_profile using (auth.uid() = user_id);

-- Plans
create table if not exists plan (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'generating' check (status in ('generating','ready','error')),
  created_at  timestamptz not null default now()
);

alter table plan enable row level security;
create policy "owner" on plan using (auth.uid() = user_id);
create index on plan(user_id, created_at desc);

-- Plan days (workout + nutrition rows per weekday)
create table if not exists plan_day (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references plan(id) on delete cascade,
  weekday     int not null check (weekday between 1 and 7),
  type        text not null check (type in ('workout','nutrition','rest')),
  content     jsonb not null,
  unique (plan_id, weekday, type)
);

alter table plan_day enable row level security;
create policy "owner" on plan_day
  using (exists (select 1 from plan where plan.id = plan_day.plan_id and plan.user_id = auth.uid()));

-- Subscriptions (written by service role via Stripe webhook)
create table if not exists subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  stripe_subscription_id text,
  stripe_customer_id     text,
  status                 text not null,
  premium_until          timestamptz not null,
  updated_at             timestamptz not null default now()
);

alter table subscriptions enable row level security;
create policy "owner_read" on subscriptions for select using (auth.uid() = user_id);
-- Writes only allowed by service role (no user policy needed)

-- Food reference data (shared, read-only for users; API writes via service role)
create table if not exists food_item (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  brand            text,
  kcal_per_100g    numeric(7,2) not null,
  protein_per_100g numeric(6,2) not null default 0,
  fat_per_100g     numeric(6,2) not null default 0,
  carbs_per_100g   numeric(6,2) not null default 0,
  serving_size_g   numeric(6,1),
  created_at       timestamptz not null default now()
);

alter table food_item enable row level security;
create policy "read_authenticated" on food_item for select using (auth.role() = 'authenticated');
create index if not exists food_item_name_idx on food_item using gin (to_tsvector('simple', name));

-- Food log (per-user meal entries)
create table if not exists food_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_date   date not null,
  meal_slot  text not null check (meal_slot in ('frukost','lunch','middag','mellanmar')),
  food_id    uuid references food_item(id) on delete set null,
  food_name  text not null,
  serving_label text,
  amount_g   numeric(7,1) not null,
  kcal       numeric(7,1) not null,
  protein_g  numeric(6,1) not null default 0,
  fat_g      numeric(6,1) not null default 0,
  carbs_g    numeric(6,1) not null default 0,
  created_at timestamptz not null default now()
);

-- Idempotent: lägg till kolumnen i befintliga databaser (visningsetikett som
-- "1 portion" för loggade recept; null = visa gram).
alter table food_log add column if not exists serving_label text;

alter table food_log enable row level security;
create policy "owner" on food_log using (auth.uid() = user_id);
create index if not exists food_log_user_date_idx on food_log(user_id, log_date);

-- Water log (per-user hydration entries)
create table if not exists water_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_date   date not null,
  amount_ml  int not null check (amount_ml > 0),
  logged_at  timestamptz not null default now()
);

alter table water_log enable row level security;
create policy "owner" on water_log using (auth.uid() = user_id);
create index if not exists water_log_user_date_idx on water_log(user_id, log_date);

-- Workout sessions (completed/partial training logs)
create table if not exists workout_session (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  plan_day_id      uuid references plan_day(id) on delete set null,
  workout_name     text not null,
  started_at       timestamptz not null,
  completed_at     timestamptz not null default now(),
  duration_seconds int not null default 0,
  total_sets       int not null default 0,
  completed_sets   int not null default 0,
  total_volume_kg  numeric(9,1) not null default 0,
  exercises        jsonb not null default '[]'::jsonb
);

alter table workout_session enable row level security;
create policy "owner" on workout_session using (auth.uid() = user_id);
create index if not exists workout_session_user_idx on workout_session(user_id, completed_at desc);

-- Body measurements (weight + girths, per-user time series)
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
create policy "owner" on body_measurement using (auth.uid() = user_id);
create index if not exists body_measurement_user_date_idx on body_measurement(user_id, measured_on desc);

-- Seed a small Swedish food reference set (idempotent on name).
insert into food_item (name, kcal_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, serving_size_g)
values
  ('Kycklingfilé',            106, 23.0, 1.5,  0.0,  150),
  ('Äggröra',                 155, 13.0, 11.0, 1.1,  100),
  ('Havregryn',               370, 13.0, 7.0,  59.0, 40),
  ('Kvarg naturell',          63,  11.0, 0.2,  3.5,  200),
  ('Bananer',                 89,  1.1,  0.3,  23.0, 120),
  ('Laxfilé',                 208, 20.0, 13.0, 0.0,  150),
  ('Brun ris (kokt)',         123, 2.7,  1.0,  26.0, 150),
  ('Pasta (kokt)',            131, 5.0,  1.1,  25.0, 200),
  ('Broccoli',                34,  2.8,  0.4,  7.0,  100),
  ('Keso',                    98,  12.0, 4.0,  3.0,  150),
  ('Knäckebröd',              340, 9.0,  2.0,  65.0, 12),
  ('Olivolja',                884, 0.0,  100.0,0.0,  10),
  ('Jordnötssmör',            588, 25.0, 50.0, 12.0, 20),
  ('Blåbär',                  57,  0.7,  0.3,  14.0, 80),
  ('Nötfärs 10%',             176, 20.0, 10.0, 0.0,  150),
  ('Potatis (kokt)',          87,  1.9,  0.1,  20.0, 200),
  ('Mjölk 1.5%',              45,  3.4,  1.5,  4.8,  250),
  ('Cheddarost',              402, 25.0, 33.0, 1.3,  30),
  ('Linser (kokta)',          116, 9.0,  0.4,  20.0, 150),
  ('Mandlar',                 579, 21.0, 50.0, 22.0, 30)
on conflict do nothing;
