-- Failed logins kept in the database, so the login limit survives server restarts and
-- works across all Vercel instances. Only username + time; rows are cleared on success.
-- ADDITIVE and idempotent.
create table if not exists public.login_failures (
  id bigint generated always as identity primary key,
  username text not null,
  at timestamptz not null default now()
);
create index if not exists login_failures_user_at_idx on public.login_failures (username, at desc);
alter table public.login_failures enable row level security;
