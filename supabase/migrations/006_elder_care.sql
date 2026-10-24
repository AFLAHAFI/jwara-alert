-- Jwara Alert: Elder care (SOS, daily "I am OK" check-in, elder profiles)
-- ADDITIVE and idempotent. Never drops or alters existing data.

alter table public.profiles add column if not exists birth_year    int;
alter table public.profiles add column if not exists lives_alone   boolean not null default false;
alter table public.profiles add column if not exists family_phone  text;
alter table public.profiles add column if not exists is_elder      boolean not null default false;
alter table public.profiles add column if not exists large_text    boolean not null default false;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_birth_year_check') then
    alter table public.profiles add constraint profiles_birth_year_check check (
      birth_year is null or (birth_year >= 1900 and birth_year <= 2100)
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_family_phone_check') then
    alter table public.profiles add constraint profiles_family_phone_check check (
      family_phone is null or family_phone ~ '^[0-9]{10}$'
    );
  end if;
end $$;

create index if not exists profiles_panchayat_elder_idx on public.profiles (panchayat_id, is_elder) where is_elder = true;

-- ---------------------------------------------------------------- SOS requests
create table if not exists public.sos_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles (id) on delete set null,
  panchayat_id int references public.panchayats (id) on delete cascade,
  ward_id      int references public.wards (id) on delete set null,
  lat          double precision null,
  lng          double precision null,
  status       text not null default 'open' check (status in ('open', 'accepted', 'resolved')),
  created_at   timestamptz not null default now(),
  accepted_by  uuid references public.profiles (id) on delete set null,
  accepted_at  timestamptz null,
  resolved_at  timestamptz null
);

create index if not exists sos_panchayat_status_created_idx
  on public.sos_requests (panchayat_id, status, created_at desc);

create index if not exists sos_user_status_created_idx
  on public.sos_requests (user_id, status, created_at desc);

alter table public.sos_requests enable row level security;

-- ---------------------------------------------------------------- Daily check-ins
create table if not exists public.checkins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  day        date not null,
  created_at timestamptz not null default now(),
  constraint checkins_user_day_uniq unique (user_id, day)
);

create index if not exists checkins_day_user_idx on public.checkins (day, user_id);

alter table public.checkins enable row level security;
