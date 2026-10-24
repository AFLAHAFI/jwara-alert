# AI usage

This project was built for **Devin Hacks Kochi** with heavy use of AI coding tools. We want to be
open about which tool did what. The team (a school student working with AI) wrote the spec, set
every product rule, reviewed every pull request, and checked the Malayalam text.

## Devin (Cognition AI): the foundation of the app

**Devin built the first working version of Jwara Alert** from an empty repository, in three reviewed
steps, each a pull request from a `devin/…` branch. Every later feature is built on top of Devin's design.

What Devin built:

1. **Project setup and data model:** the Next.js + TypeScript + Tailwind project, the Supabase schema
   (`reports`, `alerts`, `tasks`), and the **server-only database access** in `lib/supabaseAdmin.ts`.
   Every later feature still talks to the database this way, which is why the public key can read nothing.
2. **Anonymous illness reporting:** `/report` and `POST /api/report`, with the one-report-per-10-minutes
   limit (`lib/reportCookie.ts`, `lib/constants.ts`). Reports hold ward, illness and time only. This
   privacy rule never changed.
3. **The red-ward rule:** `lib/redLogic.ts` (`RED_THRESHOLD = 5`, `WINDOW_DAYS = 3`, `windowStart`).
   This is the heart of the app. The officer dashboard, the heat map, the state admin view and the
   public "Is my ward safe?" page all still use Devin's rule.
4. **Dashboard:** `/dashboard` with the ward bar chart and red wards, and `GET /api/dashboard`.
5. **Human-approved alerts:** the alert template (`lib/alertTemplate.ts`), then template → edit →
   **approve and publish** → automatic follow-up task. "No alert goes out without a human" comes from here.
6. **Tasks:** the `/tasks` checklist, and the admin PIN gate (`lib/adminAuth.ts`, `components/PinGate.tsx`)
   with server-side checks and a lock-out after wrong PINs.
7. **Emergency numbers** (108 / 112), the Malayalam-first UI text, fake seed data (`scripts/seed.ts`),
   and the first README, CHANGELOG and this file.

The team gave Devin the spec (pages, data model, rules, colours, order of work), reviewed each PR,
and decided the product rules: 5 reports in 3 days = RED, one report per 10 minutes, Malayalam first.

## Claude (Anthropic): growing Devin's version into a multi-role system

Claude extended Devin's foundation in later pull requests (#4–#8 and #10–#12):

- **Accounts and roles:** residents, health officers (approved by the state), ASHA workers and the
  state admin; bcrypt passwords and a signed session cookie; every action scoped to the user's own
  panchayat on the server.
- **Illness-aware reports and targeted alerts:** Devin's red rule applied per illness; alerts for the
  whole panchayat or chosen wards; ASHA visit assignment and visit reports.
- **Three languages** (മലയാളം, English, हिन्दी), the logo and app icons, and the phone-first layout.
- **Real places:** 28 real grama panchayats with 493 wards, the ward heat map, the Kerala map, the 7-day
  trend, and WhatsApp sharing.
- **Public "Is my ward safe?" page** and the officer's list of hospitals and health centres.
- **Audits and fixes:** read-only bug audits of the whole app (ten bug types), then fixes: one active
  SOS per person, SOS sent before asking for the location, one draft per alert form, the login limit
  kept in the database, India-date years, large text, and clear error messages.

Each change was tested on a Vercel preview in a real browser, and the test rows were deleted afterwards.
Malayalam and Hindi text was written by the AI and should be reviewed by a native speaker before real use.

## Antigravity (Google): elder care

Antigravity built the elder care feature (PR #9) from a prompt the team prepared: elder profiles
(birth year, lives alone, family phone, large text), the high-contrast elder home screen with 108 / 112,
the SOS button, the daily "I am OK" check-in, ASHA SOS triage (Accept / Resolve, map link, call family),
the elders list, and the officer SOS page. Migration `006_elder_care.sql`.

## Rules we kept for every tool

- **No AI runs inside the app.** Alert text comes from fixed templates, nothing is generated at
  runtime, and a human approves every alert before it is published.
- **All data is fake example data.** No real cases and no real people. Elected members' names from the
  source list of wards were deliberately not stored.
- **Database changes only add things.** Migrations never delete or drop existing data.
- **Every claim is checked.** In one report, the AI said some fixes were done when they had not been
  saved to the code. A later read-only audit caught this, and the fixes were then made and tested.
  Since then, every pull request claim is checked against the code and a live test.
