# Changelog

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
