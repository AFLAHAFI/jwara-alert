-- Jwara Alert: ASHA visit report + no duplicate visit tasks.
-- ADDITIVE and idempotent. Nothing is deleted.

-- What the ASHA found on the visit (filled when she marks it done).
alter table public.tasks add column if not exists visit_homes    int;
alter table public.tasks add column if not exists visit_fever    int;
alter table public.tasks add column if not exists visit_referred int;
alter table public.tasks add column if not exists visit_note     text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'tasks_visit_numbers_check') then
    alter table public.tasks add constraint tasks_visit_numbers_check check (
      (visit_homes    is null or visit_homes    between 0 and 1000) and
      (visit_fever    is null or visit_fever    between 0 and 1000) and
      (visit_referred is null or visit_referred between 0 and 1000) and
      (visit_note     is null or char_length(visit_note) <= 500)
    );
  end if;
end $$;

-- One visit task per alert + ward + ASHA (stops duplicates from a retry or a second tab).
-- Old PIN-demo tasks (no assigned ASHA) are not affected.
create unique index if not exists tasks_alert_ward_asha_uniq
  on public.tasks (alert_id, ward_id, assigned_to)
  where assigned_to is not null;
