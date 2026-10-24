# Changelog

## Step 1 — setup, schema, /report
- Next.js 14 + TypeScript + Tailwind scaffold; Noto Sans Malayalam; phone-first theme
- `supabase/schema.sql`: `reports`, `alerts`, `tasks` (ward + time only, RLS on, no policies)
- `/report`: ward dropdown, one big fever button, 10-minute cooldown (localStorage + server cookie),
  thank-you state, 108/112 `tel:` links
- `POST /api/report` using service-role key on the server only
- `.env.example`, README, AI_USAGE
