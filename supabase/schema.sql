-- Jwara Alert schema. No personal data: only ward number and time.
-- Run in Supabase SQL editor (or via the Supabase MCP).

create extension if not exists "pgcrypto";

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  ward        int  not null check (ward between 1 and 10),
  created_at  timestamptz not null default now()
);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_ward_created_at_idx on public.reports (ward, created_at desc);

create table if not exists public.alerts (
  id            uuid primary key default gen_random_uuid(),
  ward          int  not null check (ward between 1 and 10),
  body_ml       text not null,
  status        text not null default 'draft' check (status in ('draft', 'published')),
  created_at    timestamptz not null default now(),
  published_at  timestamptz
);
create index if not exists alerts_status_created_at_idx on public.alerts (status, created_at desc);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  alert_id    uuid not null references public.alerts (id) on delete cascade,
  ward        int  not null check (ward between 1 and 10),
  title       text not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists tasks_done_created_at_idx on public.tasks (done, created_at desc);

-- Row Level Security: enabled with NO policies, so the anon/publishable key
-- can read or write nothing. All access goes through server routes that use
-- the service_role key (which bypasses RLS).
alter table public.reports enable row level security;
alter table public.alerts  enable row level security;
alter table public.tasks   enable row level security;
