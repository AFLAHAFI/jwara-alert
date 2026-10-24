-- One active (open or accepted) SOS per user, so two taps at the same moment create one row.
-- ADDITIVE and idempotent.
create unique index if not exists sos_one_active_per_user
  on public.sos_requests (user_id) where status in ('open', 'accepted');
