-- FAKE example reports for the officer demo (Ernakulam -> Kunnathunad, the first panchayat by id).
-- Ward 3: 6 dengue (RED), Ward 5: 5 leptospirosis (RED), others below the line.
-- Runs only once: does nothing if that panchayat already has reports.
with p as (
  select pa.id from public.panchayats pa
  join public.districts d on d.id = pa.district_id
  where d.name_en = 'Ernakulam' order by pa.id limit 1
), plan(ward_no, slug, n) as (
  values (3,'dengue',6),(5,'leptospirosis',5),(1,'dengue',2),(1,'other-fever',2),
         (2,'diarrhoea',3),(3,'other-fever',1),(4,'typhoid',1),(6,'dengue',2),
         (7,'chikungunya',2),(8,'respiratory',3),(9,'other-fever',1)
)
insert into public.reports (panchayat_id, ward_id, disease_id, created_at)
select p.id, w.id, ds.id,
       now() - (((g.i * 7 + w.number * 3) % 60) || ' hours')::interval
from p
join public.wards w on w.panchayat_id = p.id
join plan on plan.ward_no = w.number
join public.diseases ds on ds.slug = plan.slug
cross join lateral generate_series(1, plan.n) as g(i)
where not exists (select 1 from public.reports r where r.panchayat_id = p.id);
