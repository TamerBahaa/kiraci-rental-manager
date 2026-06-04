-- ════════════════════════════════════════════════
-- Kiracı — Rental Manager — Supabase Schema
-- Run this in: Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════

-- ── OWNERS ──────────────────────────────────────
create table if not exists owners (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  name        text not null,
  phone       text,
  email       text,
  id_number   text,
  nationality text,
  bank_account text,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── TENANTS ─────────────────────────────────────
create table if not exists tenants (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users not null,
  name              text not null,
  phone             text,
  email             text,
  id_number         text,
  nationality       text,
  emergency_contact text,
  emergency_phone   text,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── UNITS ───────────────────────────────────────
create table if not exists units (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  unit_number text not null,
  building    text,
  floor       int,
  type        text,
  size_sqm    numeric,
  status      text default 'vacant' check (status in ('vacant','rented','maintenance')),
  owner_id    uuid references owners(id) on delete set null,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── CONTRACTS ───────────────────────────────────
create table if not exists contracts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  unit_id       uuid references units(id) not null,
  tenant_id     uuid references tenants(id) not null,
  start_date    date not null,
  end_date      date,
  monthly_rent  numeric not null,
  currency      text default 'TRY',
  payment_day   int default 1,
  deposit       numeric default 0,
  deposit_paid  boolean default false,
  status        text default 'active' check (status in ('active','expired','terminated')),
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── PAYMENTS ────────────────────────────────────
create table if not exists payments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users not null,
  contract_id    uuid references contracts(id) on delete cascade not null,
  due_date       date not null,
  amount         numeric not null,
  currency       text default 'TRY',
  status         text default 'pending' check (status in ('paid','pending','overdue','upcoming')),
  paid_date      date,
  payment_method text,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ── ROW LEVEL SECURITY ─────────────────────────
alter table owners    enable row level security;
alter table tenants   enable row level security;
alter table units     enable row level security;
alter table contracts enable row level security;
alter table payments  enable row level security;

-- Each user only sees their own data
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'owners_policy') then
    create policy owners_policy    on owners    using (auth.uid() = user_id) with check (auth.uid() = user_id);
    create policy tenants_policy   on tenants   using (auth.uid() = user_id) with check (auth.uid() = user_id);
    create policy units_policy     on units     using (auth.uid() = user_id) with check (auth.uid() = user_id);
    create policy contracts_policy on contracts using (auth.uid() = user_id) with check (auth.uid() = user_id);
    create policy payments_policy  on payments  using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- ── INDEXES ─────────────────────────────────────
create index if not exists idx_units_user      on units(user_id);
create index if not exists idx_contracts_unit  on contracts(unit_id);
create index if not exists idx_payments_contract on payments(contract_id);
create index if not exists idx_payments_status on payments(status, due_date);
