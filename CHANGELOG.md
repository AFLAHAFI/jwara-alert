# Changelog

## Elder care (SOS, daily check-in, elders list)
- High-contrast elder home screen on `/home/citizen` for residents aged 60+ (`is_elder`): big 108/112 call buttons with ambulance disclaimer, huge red SOS button, and green "I am OK today" check-in button
- Big red SOS button: confirms intent, requests browser geolocation, calls `POST /api/sos` (idempotent within 15 mins), and shows "SOS sent" with 108 shortcut
- Daily "I am OK" check-in: `POST /api/checkin` (idempotent per Asia/Kolkata day); updates status with time
- Large text toggle (`POST /api/me/prefs`): sets `profiles.large_text`, applying enlarged font on `<body>` across all pages
- Resident sign-up: added optional Year of birth, "I live alone" (Yes/No), and Family contact phone; server sets `is_elder = (current_year - birth_year) >= 60` and `large_text = is_elder`
- ASHA `/home/asha`:
  - Active SOS alerts at top with Open / Accepted status, OpenStreetMap link, and `tel:` call family link
  - Actions to Accept and Resolve SOS alerts with conditional updates (`PATCH /api/sos/[id]`)
  - "Elders in my panchayat" list with age, ward, lives alone, family phone, and today's status (alone elders without check-in highlighted first in red)
  - "Add elder" form (`POST /api/asha/elders`) to register seniors in her panchayat directly
- Health officer: Active SOS count card on `/home/officer` and dedicated `/officer/sos` page (added to officer nav); can Accept and Resolve SOS requests in their panchayat
- Demo accounts: `elder_1` (Ward 1, born 1950, lives alone, family phone 9000000001) and `elder_2` (Ward 3, born 1956, not alone)
- Migration `supabase/migrations/006_elder_care.sql` (additive and idempotent)

## ASHA visit report + audit fixes
- ASHA "Mark visit done" opens a short report: homes visited, people with fever, people referred, note
- Officer Tasks: per-visit results and totals; Alerts page shows results under each visit; state admin KPIs for homes visited and people referred
- Audit fixes: resident home and report page show an error (never a false "no alerts") when loading fails; officer dashboard hides "no red wards" on error; one visit per alert + ward + ASHA (unique index, 409); due date must be a real calendar day; quick-demo save says "Saved"
- Migration `005_visit_report.sql` (additive only)

## Real places, maps and trends
- Migration `004_real_places.sql`: 28 real grama panchayats (2 per district), renamed in place so no data is lost; real ward counts (493 wards) and ward names 1–10
- Ward names shown everywhere ("Ward 3 · Parakkode")
- Per-account report limit (10 minutes), atomic, on top of the per-phone limit
- "Share on WhatsApp" on every published alert, in the reader's language
- Officer: ward heat map with tap-for-details, and a 7-day trend per illness (rising / falling / steady)
- State admin: schematic Kerala district map linked to district pages

## Phase D + E — languages, state admin, design
- Language switch on every page: മലയാളം (default), English, हिन्दी; remembered per device and per account
- Every screen, API error, illness and place name translated; `npm run check:i18n`
- Officer alerts in up to 3 languages from illness-specific templates; residents see their language (Malayalam fallback)
- New logo, favicon, app icons, social preview image, PWA manifest ("Add to Home screen")
- Phone-first layout: bottom tab bar per role, 2-column dashboards on laptops, skeleton loading, offline notice
- State admin: Kerala KPIs, district table + drill-down, red wards with alert status, officer switch-off
- Migration `003_i18n_admin.sql` (additive only)

## Phase B + C — citizen reports by illness, area alerts, officer tools, ASHA tasks
- Migration `supabase/migrations/002_phase_bc.sql` (additive): `alert_wards`, task due date/done time, `profiles.disabled`
- Citizens: illness dropdown on `/report` (ward from account, still anonymous); `/alerts` shows only their area; `/home/citizen` latest alert + counts
- Officers: `/home/officer` dashboard (illness filter, red = 5+ of one illness in 3 days), `/officer/alerts` (whole panchayat or chosen wards, Malayalam template per illness, draft → publish, assign ASHA visits), `/officer/ashas`, `/officer/tasks`
- ASHAs: `/home/asha` task list with "Mark visit done"
- All officer/ASHA routes are scoped to the user's own panchayat on the server
- Old PIN pages only use old rows, so the original demo is unchanged
- Demo data: `supabase/demo/phase_bc_demo_reports.sql`

## Phase A — accounts and Kerala locations
- Migration `supabase/migrations/001_phase_a.sql`: districts, panchayats, wards, diseases, profiles (+ nullable columns on reports/alerts/tasks)
- Login/register (bcrypt + signed httpOnly session cookie, `SESSION_SECRET`); roles: state_admin, panchayat_officer, asha, citizen
- Officers register per panchayat and wait for state-admin approval (`/home/admin`)
- `/login`, `/register`, `/officer/register`, `/home/*`; session-aware header
- `npm run seed:accounts` creates fake demo accounts
- Existing `/report`, `/dashboard`, `/alerts`, `/tasks` unchanged

## Step 3 — alerts and tasks
- `/alerts` (public): published alerts newest first; with the admin PIN unlocked, drafts appear on top with an editor
- `PATCH /api/alerts/:id` edits a draft; `POST /api/alerts/:id/publish` approves it (optionally with final text)
- Publishing is guarded by `status = 'draft'` and creates exactly one task: "Visit Ward N houses"
- `/tasks` (admin PIN): checkbox list, open tasks first; `GET /api/tasks`, `PATCH /api/tasks/:id`

## Step 2 — dashboard, red logic, seed
- `/dashboard` behind a PIN gate; PIN verified on the server (`x-admin-pin` header, `lib/adminAuth.ts`)
- `lib/redLogic.ts`: `RED_THRESHOLD = 5`, `WINDOW_DAYS = 3`
- Per-ward bar chart with the red threshold line; red wards get a "Create alert" button
- `POST /api/alerts` creates a draft alert from `lib/alertTemplate.ts` (Malayalam, fixed text)
- `scripts/seed.ts` (`npm run seed`): fake example data, Ward 3 = 6 and Ward 7 = 5 reports

## Step 1 — setup, schema, /report
- Next.js 14 + TypeScript + Tailwind scaffold; Noto Sans Malayalam; phone-first theme
- `supabase/schema.sql`: `reports`, `alerts`, `tasks` (ward + time only, RLS on, no policies)
- `/report`: ward dropdown, one big fever button, 10-minute cooldown (localStorage + server cookie),
  thank-you state, 108/112 `tel:` links
- `POST /api/report` using service-role key on the server only
- `.env.example`, README, AI_USAGE
