-- Jwara Alert, Phase B + C: disease reports per panchayat, targeted alerts, ASHA tasks.
-- ADDITIVE and idempotent: safe to run twice. Old rows (panchayat_id is null) keep working
-- and still drive the original PIN demo (/dashboard, /alerts, /tasks).

-- New-style rows use ward_id instead of the legacy ward number (1-10).
alter table public.reports alter column ward drop not null;
alter table public.alerts  alter column ward drop not null;
alter table public.tasks   alter column ward drop not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'reports_ward_any_check') then
    alter table public.reports add constraint reports_ward_any_check check (ward is not null or ward_id is not null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'alerts_ward_any_check') then
    alter table public.alerts add constraint alerts_ward_any_check check (ward is not null or panchayat_id is not null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tasks_ward_any_check') then
    alter table public.tasks add constraint tasks_ward_any_check check (ward is not null or ward_id is not null);
  end if;
end $$;

-- Who did what (officer accounts), and task due dates.
alter table public.alerts   add column if not exists created_by uuid references public.profiles (id);
alter table public.tasks    add column if not exists created_by uuid references public.profiles (id);
alter table public.tasks    add column if not exists due_date   date;
alter table public.tasks    add column if not exists done_at    timestamptz;
-- Officers can switch off an ASHA account without deleting it.
alter table public.profiles add column if not exists disabled   boolean not null default false;

-- Wards an alert is sent to when target = 'wards'.
create table if not exists public.alert_wards (
  alert_id  uuid not null references public.alerts (id) on delete cascade,
  ward_id   int  not null references public.wards (id),
  primary key (alert_id, ward_id)
);
alter table public.alert_wards enable row level security;

create index if not exists alerts_panchayat_status_idx on public.alerts (panchayat_id, status, created_at desc);
create index if not exists reports_ward_id_created_idx on public.reports (ward_id, created_at desc);
create index if not exists tasks_panchayat_done_idx    on public.tasks (panchayat_id, done, created_at desc);
create index if not exists alert_wards_ward_idx        on public.alert_wards (ward_id);
