-- One draft per "Save draft" form, even with a retry or a double request: the form sends
-- a random id, and the same id can only create one alert. ADDITIVE and idempotent.
alter table public.alerts add column if not exists client_ref uuid;
create unique index if not exists alerts_client_ref_uniq on public.alerts (client_ref) where client_ref is not null;
