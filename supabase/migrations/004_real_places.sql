-- Jwara Alert: real grama panchayat names, ward counts and ward names (demo data from the LSGD directory list).
-- ADDITIVE and idempotent. The 28 "Example Panchayat" rows are RENAMED in place (same ids),
-- so every report, account, alert and task stays linked. Nothing is deleted.

alter table public.wards add column if not exists name text;
alter table public.panchayats add column if not exists lgd_ref text;
-- Per-account report limit (the report row itself still stores no user id).
alter table public.profiles add column if not exists last_report_at timestamptz;

drop table if exists _gp;
create temporary table _gp (district text, slot int, name_en text, name_ml text, name_hi text, lgd_ref text, total int);
insert into _gp values
  ('Thiruvananthapuram', 1, 'Pulimath', 'പുളിമാത്ത്', 'पुलिमाथ', '239', 19),
  ('Thiruvananthapuram', 2, 'Kizhuvilam', 'കിഴുവിലം', 'किझुविलम', '244', 20),
  ('Kollam', 1, 'Panayam', 'പനയം', 'पनयम', '348', 16),
  ('Kollam', 2, 'Poothakulam', 'പൂതക്കുളം', 'पूतक्कुलम', '360', 18),
  ('Pathanamthitta', 1, 'Koipuram', 'കോയിപ്രം', 'कोयिप्रम', '386', 17),
  ('Pathanamthitta', 2, 'Kaviyoor', 'കവിയൂർ', 'कवियूर', '373', 14),
  ('Alappuzha', 1, 'Ala', 'ആല', 'आला', '467', 13),
  ('Alappuzha', 2, 'Neelamperoor', 'നീലംപേരൂർ', 'नीलमपेरूर', '460', 13),
  ('Kottayam', 1, 'Athirampuzha', 'അതിരമ്പുഴ', 'अतिरमपुझा', '514', 22),
  ('Kottayam', 2, 'Arpookara', 'ആർപ്പൂക്കര', 'आर्पूक्करा', '515', 16),
  ('Idukki', 1, 'Adimaly', 'അടിമാലി', 'अडिमाली', '573', 21),
  ('Idukki', 2, 'Idukki Kanjikuzhy', 'ഇടുക്കി കഞ്ഞിക്കുഴി', 'इडुक्की कंजिकुझी', '599', 18),
  ('Ernakulam', 1, 'Kunnathunad', 'കുന്നത്തുനാട്', 'कुन्नत्तुनाड', '680', 18),
  ('Ernakulam', 2, 'Udayamperoor', 'ഉദയംപേരൂർ', 'उदयमपेरूर', '669', 20),
  ('Thrissur', 1, 'Puthur', 'പുത്തൂർ', 'पुत्तूर', '744', 23),
  ('Thrissur', 2, 'Mullassery', 'മുല്ലശ്ശേരി', 'मुल्लस्सेरी', '752', 15),
  ('Palakkad', 1, 'Kulukkallur', 'കുലുക്കല്ലൂർ', 'कुलुक्कल्लूर', '812', 17),
  ('Palakkad', 2, 'Puducode', 'പുതുക്കോട്', 'पुदुकोड', '881', 15),
  ('Malappuram', 1, 'Elamkulam', 'ഏലംകുളം', 'एलमकुलम', '937', 16),
  ('Malappuram', 2, 'Oorakam', 'ഊരകം', 'ऊरकम', '932', 17),
  ('Kozhikode', 1, 'Kakkodi', 'കക്കോടി', 'कक्कोडी', '1040', 21),
  ('Kozhikode', 2, 'Kuruvattoor', 'കുരുവട്ടൂർ', 'कुरुवट्टूर', '1056', 18),
  ('Wayanad', 1, 'Ambalavayal', 'അമ്പലവയൽ', 'अंबलवयल', '1080', 20),
  ('Wayanad', 2, 'Muttil', 'മുട്ടിൽ', 'मुट्टिल', '1089', 19),
  ('Kannur', 1, 'Kottayam-Malabar', 'കോട്ടയം-മലബാർ', 'कोट्टयम-मलबार', '1148', 14),
  ('Kannur', 2, 'Alakode', 'ആലക്കോട്', 'आलक्कोड', '1120', 21),
  ('Kasaragod', 1, 'West Eleri', 'വെസ്റ്റ് എളേരി', 'वेस्ट एलेरी', null, 18),
  ('Kasaragod', 2, 'Puthige', 'പുത്തിഗെ', 'पुत्तिगे', '1181', 14);

-- Rename Example Panchayat N (only while it still has the placeholder name).
update public.panchayats p
set name_en = g.name_en, name_ml = g.name_ml, name_hi = g.name_hi, lgd_ref = g.lgd_ref
from _gp g, public.districts d
where d.id = p.district_id and d.name_en = g.district and p.name_en = 'Example Panchayat ' || g.slot;

-- Add the missing wards up to the real total.
insert into public.wards (panchayat_id, number)
select p.id, n
from _gp g
join public.districts d on d.name_en = g.district
join public.panchayats p on p.district_id = d.id and p.name_en = g.name_en
cross join lateral generate_series(1, g.total) as n
on conflict (panchayat_id, number) do nothing;

-- Ward names (wards 1-10 from the source list), only where empty.
update public.wards w set name = (array['Sheemavila', 'Pullayil', 'Pulimath', 'Porunthamon', 'Manjappara', 'Kudappara', 'Kattumpuram', 'Arivarikuzhi', 'Kolluvila', 'Payattingakuzhi']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Thiruvananthapuram' and p.name_en = 'Pulimath' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Puravoor', 'Pavoorkonam', 'Kattumpuram', 'Velloorkonam', 'Puliyoorkonam', 'Mamamnada', 'Arikathwar', 'Kurakkada', 'Nainamkonam', 'Mudapuram']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Thiruvananthapuram' and p.name_en = 'Kizhuvilam' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Perumon West', 'Perumon East', 'P.H.C', 'Railwaystation', 'Chemmakkadu', 'Charukadu', 'Chathinamkulam', 'Gurukulam', 'Pampalil', 'Kandachira']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Kollam' and p.name_en = 'Panayam' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Kottuvankonam', 'Mukkada', 'Koonamkulam', 'Puthankulam', 'Oonninmoodu', 'Ezhamvila', 'Poothakulam', 'H.S.Ward', 'Punnekkulam', 'Edayadi']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Kollam' and p.name_en = 'Poothakulam' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Kumbanadu Vadakku', 'Iyrakkavu', 'Kanjirappara', 'Kuravankuzhy', 'Pullad Kizhakku', 'Pullad Vadakku', 'Pullad', 'Varayannoor', 'Poovathoor', 'Kadapra']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Pathanamthitta' and p.name_en = 'Koipuram' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Aikkuzhi', 'Mundiyappally', 'Punnilam', 'Nazhippara', 'Kottoor', 'Mathimala', 'Kaviyoor', 'Njalbhagom', 'Thottabhagom', 'Manackachira']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Pathanamthitta' and p.name_en = 'Kaviyoor' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Ala', 'Ummath', 'Poomala', 'Malamodi', 'Kinaruvila', 'Valappuzha', 'Thevaracode', 'Kodukulanji', 'Chammath', 'Pennukkara']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Alappuzha' and p.name_en = 'Ala' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Pullayam', 'Neelamperoor North', 'Neelamperoor South', 'Eara North', 'Chakkachampakka', 'Eara South', 'Payattupakka', 'Valady', 'Narakathara', 'East Chennamkaru']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Alappuzha' and p.name_en = 'Neelamperoor' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Vedagiri', 'Kottakkupuram', 'ITI', 'Kattathi', 'Railway Station', 'Manakkapadam', 'Thrukkel', 'Central', 'Town', 'University']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Kottayam' and p.name_en = 'Athirampuzha' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Manchadikkari', 'Maniyaparambu', 'Choorakkavu', 'Pinanchirakuzhy', 'Villoonni', 'Thonnamkuzhy', 'Nerekadavu', 'Varyamuttom Charamkulam', 'Medical College', 'Angadi']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Kottayam' and p.name_en = 'Arpookara' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Pazhampillichal', 'Parisakallu', 'Irumpupalam', 'Plakkayam', '14th Mile', 'Machiplavu', 'Chattupara', 'Adimali North', 'Thalamali', 'Karimkulam']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Idukki' and p.name_en = 'Adimaly' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Thattekkanni', 'Keerithode', 'Anchukudy', 'Chelachuvadu', 'Kathippara', 'Attikkalam', 'Churuli', 'Alppara', 'Mazhuvady', 'Thallakkanam']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Idukki' and p.name_en = 'Idukki Kanjikuzhy' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Chittanadu', 'Erumeli', 'Parakkode', 'Punnorkode', 'Kaithakkadu South', 'Kaithakkadu North', 'Pattimattom', 'Chengara North', 'Chengara South', 'Parakkode East']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Ernakulam' and p.name_en = 'Kunnathunad' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Malekadu', 'Perumthrikkovil', 'Udayamperoor', 'Kandanad', 'Valiyakulam East', 'Nadakavu', 'Kochupally', 'Poothotta', 'Puthankavu', 'Punnackaveli']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Ernakulam' and p.name_en = 'Udayamperoor' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Kainoor', 'Thonippara', 'Cherukunnu', 'Ezhamkallu', 'Mannamangalam', 'Vellakkarithadam', 'Maruthukuzhy', 'Marottichal', 'Kallaikunnu', 'Chembamkandam']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Thrissur' and p.name_en = 'Puthur' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Thirunellur', 'Peruvallur', 'Ambedkargramam', 'Penakam', 'Annakara', 'Elavathur', 'Pathiyarkulangara', 'Thanaveethy', 'Manina', 'Parambanthaly']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Thrissur' and p.name_en = 'Mullassery' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Chundampatta', 'Natyamangalam North', 'Natyamangalam', 'Chundampatta East', 'Thathnampully', 'Thathnampully South', 'Mappatukara West', 'Mappatukara East', 'Puramathra', 'Puramathra South']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Palakkad' and p.name_en = 'Kulukkallur' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Thiruvadi', 'Kanakkannur', 'Pattola', 'Chandhappura', 'Manappadam', 'Theruvu', 'Thachanadi', 'Anjumuri', 'Gramam', 'Appakkad']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Palakkad' and p.name_en = 'Puducode' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Cherukara', 'Alumkoottam', 'Kizhungathole', 'Parakkalmukku', 'Chenganampatta', 'Etheparambu', 'Chenamparambu', 'Muthukurussi', 'Kunnakkavu', 'Mallisseri']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Malappuram' and p.name_en = 'Elamkulam' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Nedumparamb', 'Kuttaloor', 'O.K.M. Nagar', 'Karimbili', 'Kodalikkund', 'Yarampadi', 'Pullanchal', 'Oorakam Mala', 'Puthan Peedika', 'Karathod']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Malappuram' and p.name_en = 'Oorakam' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Cherukulam', 'Badiroor', 'Kottupadam', 'Thekkannithazham', 'Chelapram', 'Kottakkal Thazham', 'Koodathumpoyil', 'Perinjilamala', 'Kannadichalil', 'Padinhattummuri']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Kozhikode' and p.name_en = 'Kakkodi' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Kuruvattoor North', 'Pullaloor', 'Kuruvattoor', 'Kuruvattoor East', 'Payambra North', 'Payimbra', 'Payimbra East', 'Konott', 'Poloor East', 'Poloor']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Kozhikode' and p.name_en = 'Kuruvattoor' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Karachal', 'Kumbaleri', 'Ayiramkolly', 'Kuppamudi', 'Ambalavayal East', 'Ambalavayal West', 'Neerchal', 'Andoor', 'Pambala', 'Kottoor']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Wayanad' and p.name_en = 'Ambalavayal' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Madakkimala', 'Kumbalad', 'Pariyaram', 'Kolavayal', 'Panamkandy', 'Kariyambadi', 'Variyad', 'Theneri', 'Vazhavatta', 'Pakkam']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Wayanad' and p.name_en = 'Muttil' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Mouverry', 'Kinavakkal', 'Purakkalam', 'Kottayam Angadi', 'Thallod', 'Kottayampoil', 'Kanathum Chira', 'Kunninu Meethal', 'Aarammile', 'Eruvatty']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Kannur' and p.name_en = 'Kottayam-Malabar' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Chittadi', 'Therthalli', 'Rayarome', 'Moonnamkunnu', 'Parappa', 'Kuttaparamba', 'Alakode', 'Ottathai', 'Kappimala', 'Nellikunnu']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Kannur' and p.name_en = 'Alakode' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Parappachal', 'Bheemanady', 'Chennadukkam', 'Eleri', 'Punnakunnu', 'Plachikkara', 'Nattakkal', 'Karuvankayam', 'Paramba', 'Chattamala']::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Kasaragod' and p.name_en = 'West Eleri' and w.number <= 10 and w.name is null;
update public.wards w set name = (array['Chennikodi', 'Dharmathadka', 'Deradka', 'Badoor', 'Mugu', 'Urmi', 'Ujampdavu', 'Seethangoli', 'Kannur', null]::text[])[w.number] from public.panchayats p join public.districts d on d.id = p.district_id where w.panchayat_id = p.id and d.name_en = 'Kasaragod' and p.name_en = 'Puthige' and w.number <= 10 and w.name is null;

drop table if exists _gp;
