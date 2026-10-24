-- Hospitals / health centres per panchayat, added by the panchayat health officer.
-- Additive only: a new table, nothing existing changes.
create table if not exists health_facilities (
  id bigint generated always as identity primary key,
  panchayat_id integer not null references panchayats(id),
  name text not null check (char_length(name) between 2 and 100),
  kind text not null check (kind in ('phc','fhc','chc','taluk','district','private','other')),
  phone text check (phone is null or phone ~ '^[0-9+ -]{3,20}$'),
  address text check (address is null or char_length(address) <= 200),
  open_24h boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists health_facilities_panchayat on health_facilities(panchayat_id);
alter table health_facilities enable row level security;
