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
