-- Limit for reports sent WITHOUT an account, per network. Additive only: a new table.
-- net_key is an HMAC of the network address (never the address itself) and is never
-- stored with a report, so reports stay anonymous.
create table if not exists report_net_limits (
  id bigint generated always as identity primary key,
  net_key text not null check (char_length(net_key) between 16 and 64),
  at timestamptz not null default now()
);
create index if not exists report_net_limits_key_at on report_net_limits (net_key, at desc);
alter table report_net_limits enable row level security;
