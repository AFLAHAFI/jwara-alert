-- Jwara Alert, Phase D/E: languages (English, Malayalam, Hindi) and state-admin tools.
-- ADDITIVE and idempotent: only adds columns and fills empty Hindi names. Nothing is deleted.

-- Preferred UI language per account (null = use the browser cookie / Malayalam).
alter table public.profiles add column if not exists lang text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_lang_check') then
    alter table public.profiles add constraint profiles_lang_check check (lang is null or lang in ('ml', 'en', 'hi'));
  end if;
end $$;

-- Hindi names for places and illnesses.
alter table public.districts  add column if not exists name_hi text;
alter table public.panchayats add column if not exists name_hi text;
alter table public.diseases   add column if not exists name_hi text;

-- Officer alerts can carry English and Hindi text next to the Malayalam text (fallback).
alter table public.alerts add column if not exists body_en text;
alter table public.alerts add column if not exists body_hi text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'alerts_body_len_check') then
    alter table public.alerts add constraint alerts_body_len_check
      check (coalesce(char_length(body_en), 0) <= 4000 and coalesce(char_length(body_hi), 0) <= 4000);
  end if;
end $$;

-- Fill Hindi names only where empty (never overwrites an edit).
update public.districts d set name_hi = v.hi
from (values
  ('Thiruvananthapuram', 'तिरुवनंतपुरम'), ('Kollam', 'कोल्लम'), ('Pathanamthitta', 'पत्तनंतिट्टा'),
  ('Alappuzha', 'आलप्पुझा'), ('Kottayam', 'कोट्टयम'), ('Idukki', 'इडुक्की'), ('Ernakulam', 'एर्णाकुलम'),
  ('Thrissur', 'त्रिशूर'), ('Palakkad', 'पालक्काड'), ('Malappuram', 'मलप्पुरम'), ('Kozhikode', 'कोझिकोड'),
  ('Wayanad', 'वायनाड'), ('Kannur', 'कन्नूर'), ('Kasaragod', 'कासरगोड')
) as v(en, hi)
where d.name_en = v.en and d.name_hi is null;

update public.panchayats
set name_hi = 'उदाहरण पंचायत ' || substring(name_en from 'Example Panchayat (\d+)')
where name_hi is null and name_en ~ '^Example Panchayat \d+$';

update public.diseases ds set name_hi = v.hi
from (values
  ('dengue', 'डेंगू'), ('leptospirosis', 'लेप्टोस्पायरोसिस (चूहा बुखार)'), ('chikungunya', 'चिकनगुनिया'),
  ('malaria', 'मलेरिया'), ('hepatitis-a', 'पीलिया / हेपेटाइटिस ए'), ('typhoid', 'टाइफाइड'),
  ('diarrhoea', 'दस्त / उल्टी'), ('cholera', 'हैजा'), ('chickenpox', 'चिकनपॉक्स (छोटी माता)'),
  ('measles', 'खसरा'), ('mumps', 'गलसुआ (मम्प्स)'), ('h1n1', 'H1N1 इन्फ्लुएंजा'),
  ('respiratory', 'खांसी / सांस की बीमारी'), ('skin-infection', 'त्वचा संक्रमण'), ('other-fever', 'अन्य बुखार'),
  ('scrub-typhus', 'स्क्रब टाइफस'), ('nipah', 'निपाह (केवल अधिकारी)')
) as v(slug, hi)
where ds.slug = v.slug and ds.name_hi is null;
