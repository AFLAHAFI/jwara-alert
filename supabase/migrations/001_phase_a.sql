-- Jwara Alert, Phase A: Kerala-wide foundation (locations, diseases, accounts).
-- ADDITIVE and idempotent: safe to run twice. Existing reports/alerts/tasks data and columns are untouched.
-- Run in the Supabase SQL editor. All access stays server-side (service_role), so RLS has no policies.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- locations
create table if not exists public.districts (
  id       int generated always as identity primary key,
  name_en  text not null unique,
  name_ml  text not null
);

create table if not exists public.panchayats (
  id           int generated always as identity primary key,
  district_id  int  not null references public.districts (id) on delete cascade,
  name_en      text not null,
  name_ml      text not null,
  unique (district_id, name_en)
);
create index if not exists panchayats_district_idx on public.panchayats (district_id);

create table if not exists public.wards (
  id            int generated always as identity primary key,
  panchayat_id  int not null references public.panchayats (id) on delete cascade,
  number        int not null check (number between 1 and 40),
  unique (panchayat_id, number)
);
create index if not exists wards_panchayat_idx on public.wards (panchayat_id);

-- ---------------------------------------------------------------- diseases
create table if not exists public.diseases (
  id                  int generated always as identity primary key,
  slug                text not null unique,
  name_en             text not null,
  name_ml             text not null,
  citizen_selectable  boolean not null default true,
  sort_order          int not null default 0
);

-- ---------------------------------------------------------------- accounts
create table if not exists public.profiles (
  id             uuid primary key default gen_random_uuid(),
  username       text not null unique check (username = lower(username) and username ~ '^[a-z0-9_.]{3,30}$'),
  password_hash  text not null,
  display_name   text not null check (char_length(display_name) between 1 and 80),
  role           text not null check (role in ('state_admin', 'panchayat_officer', 'asha', 'citizen')),
  district_id    int references public.districts (id),
  panchayat_id   int references public.panchayats (id),
  ward_id        int references public.wards (id),
  designation    text check (designation is null or char_length(designation) <= 80),
  approved       boolean not null default false,
  created_at     timestamptz not null default now(),
  check (role <> 'citizen' or ward_id is not null),
  check (role not in ('panchayat_officer', 'asha') or panchayat_id is not null)
);
create index if not exists profiles_role_approved_idx on public.profiles (role, approved);
create index if not exists profiles_panchayat_idx on public.profiles (panchayat_id);

-- ------------------------------------- nullable columns for later phases (B-D)
alter table public.reports add column if not exists panchayat_id int references public.panchayats (id);
alter table public.reports add column if not exists ward_id      int references public.wards (id);
alter table public.reports add column if not exists disease_id   int references public.diseases (id);

alter table public.alerts  add column if not exists panchayat_id int references public.panchayats (id);
alter table public.alerts  add column if not exists disease_id   int references public.diseases (id);
alter table public.alerts  add column if not exists target       text not null default 'all';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'alerts_target_check') then
    alter table public.alerts add constraint alerts_target_check check (target in ('all', 'wards'));
  end if;
end $$;

alter table public.tasks   add column if not exists panchayat_id int references public.panchayats (id);
alter table public.tasks   add column if not exists ward_id      int references public.wards (id);
alter table public.tasks   add column if not exists assigned_to  uuid references public.profiles (id);

create index if not exists reports_panchayat_created_idx on public.reports (panchayat_id, created_at desc);
create index if not exists tasks_assigned_idx on public.tasks (assigned_to, done);

-- ---------------------------------------------------------------- RLS (no policies)
alter table public.districts  enable row level security;
alter table public.panchayats enable row level security;
alter table public.wards      enable row level security;
alter table public.diseases   enable row level security;
alter table public.profiles   enable row level security;

-- ---------------------------------------------------------------- seed (idempotent)
insert into public.districts (name_en, name_ml) values
  ('Thiruvananthapuram', 'തിരുവനന്തപുരം'),
  ('Kollam', 'കൊല്ലം'),
  ('Pathanamthitta', 'പത്തനംതിട്ട'),
  ('Alappuzha', 'ആലപ്പുഴ'),
  ('Kottayam', 'കോട്ടയം'),
  ('Idukki', 'ഇടുക്കി'),
  ('Ernakulam', 'എറണാകുളം'),
  ('Thrissur', 'തൃശൂർ'),
  ('Palakkad', 'പാലക്കാട്'),
  ('Malappuram', 'മലപ്പുറം'),
  ('Kozhikode', 'കോഴിക്കോട്'),
  ('Wayanad', 'വയനാട്'),
  ('Kannur', 'കണ്ണൂർ'),
  ('Kasaragod', 'കാസർകോട്')
on conflict (name_en) do nothing;

-- Two EXAMPLE panchayats per district (names are placeholders until real ones are supplied).
insert into public.panchayats (district_id, name_en, name_ml)
select d.id, 'Example Panchayat ' || n.i, 'മാതൃകാ പഞ്ചായത്ത് ' || n.i
from public.districts d
cross join (values (1), (2)) as n(i)
on conflict (district_id, name_en) do nothing;

insert into public.wards (panchayat_id, number)
select p.id, w.n
from public.panchayats p
cross join generate_series(1, 10) as w(n)
on conflict (panchayat_id, number) do nothing;

insert into public.diseases (slug, name_en, name_ml, citizen_selectable, sort_order) values
  ('dengue',          'Dengue',                           'ഡെങ്കിപ്പനി',                          true, 10),
  ('leptospirosis',   'Leptospirosis (rat fever)',        'എലിപ്പനി',                            true, 20),
  ('chikungunya',     'Chikungunya',                      'ചിക്കുൻഗുനിയ',                       true, 30),
  ('malaria',         'Malaria',                          'മലേറിയ',                              true, 40),
  ('hepatitis-a',     'Jaundice / Hepatitis A',           'മഞ്ഞപ്പിത്തം (ഹെപ്പറ്റൈറ്റിസ് എ)',    true, 50),
  ('typhoid',         'Typhoid',                          'ടൈഫോയ്ഡ്',                           true, 60),
  ('diarrhoea',       'Diarrhoea / vomiting',             'വയറിളക്കം / ഛർദ്ദി',                  true, 70),
  ('cholera',         'Cholera',                          'കോളറ',                                true, 80),
  ('chickenpox',      'Chickenpox',                       'ചിക്കൻപോക്സ്',                       true, 90),
  ('measles',         'Measles',                          'അഞ്ചാംപനി',                           true, 100),
  ('mumps',           'Mumps',                            'മുണ്ടിനീര്',                          true, 110),
  ('h1n1',            'H1N1 influenza',                   'എച്ച്1എൻ1 പനി',                      true, 120),
  ('respiratory',     'Cough / respiratory illness',      'ചുമ / ശ്വാസകോശ അണുബാധ',              true, 130),
  ('skin-infection',  'Skin infection',                   'ത്വക്ക് അണുബാധ',                      true, 140),
  ('other-fever',     'Other fever',                      'മറ്റ് പനി',                            true, 150),
  ('scrub-typhus',    'Scrub typhus',                     'ചെള്ളുപനി',                           false, 900),
  ('nipah',           'Nipah (officer-only)',             'നിപ (ഉദ്യോഗസ്ഥർക്ക് മാത്രം)',        false, 910)
on conflict (slug) do nothing;
