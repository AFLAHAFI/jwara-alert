-- One entry per health centre name in a panchayat (stops double adds from two tabs).
-- Additive only: a new index. The table was empty when this was applied.
create unique index if not exists health_facilities_unique_name on health_facilities (panchayat_id, lower(name));
