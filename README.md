# ജ്വര അലർട്ട് · Jwara Alert

Mobile-first web app that helps a Kerala panchayat **spot fever clusters early and act on them**:
residents tap one button to say "fever in my house" (ward + time only, no personal data),
health workers see a per-ward dashboard, and a RED ward triggers a Malayalam public alert
plus a follow-up field task.

Hackathon track: **"Make the invisible visible"** — the focus is what happens *after* detection.

> **All data in this app is fake example data.** No real cases, no personal information.

## Tech

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Supabase (Postgres) accessed **only from server routes** (`app/api/*`) with the service-role key
- Font: Noto Sans Malayalam · phone-first layout · times shown in Asia/Kolkata

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values (see below)
npm run dev                  # http://localhost:3000
```

### Database

1. Create a Supabase project.
2. Open the SQL editor and paste `supabase/schema.sql`. Run it.
3. Copy the project URL and the `service_role` key into `.env.local`.

### Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | server only | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | service-role key, used in `app/api/*` only |
| `ADMIN_PIN` | server only | PIN for `/dashboard`, `/tasks`, create/publish APIs |
| `REPORT_COOKIE_SECRET` | server only, optional | signs the report-cooldown cookie (defaults to the service-role key) |

None of these are prefixed `NEXT_PUBLIC_`, so nothing reaches the browser.

### Example data

```bash
npm run seed          # empty DB only: fake reports, Ward 3 = 6, Ward 7 = 5 (RED), others 0-3
npm run seed:reset    # wipes reports/alerts/tasks first, then seeds
```

Everything the seed creates is **fake example data**; the UI says so on every page.

### Admin PIN

`/dashboard` and `/tasks` ask for `ADMIN_PIN`. The browser only keeps it in `sessionStorage`
and sends it as an `x-admin-pin` header; every admin API route checks it on the server
(`lib/adminAuth.ts`). Nothing admin-related is decided in the browser.

## Deploy on Vercel

1. Import the GitHub repo in Vercel (framework: Next.js, defaults are fine).
2. Project → Settings → Environment Variables → add the three variables above for
   Production (and Preview if you want).
3. Deploy.

## Pages

| Route | Who | What |
| --- | --- | --- |
| `/report` | public | Ward dropdown + one big "വീട്ടിൽ പനി ഉണ്ട്" button. 1 report / 10 min per phone (localStorage + server cookie). 108 / 112 as `tel:` links. |
| `/dashboard` | admin PIN | Bar chart of reports per ward, last 3 days. RED ward = 5+ reports (`lib/redLogic.ts`) → "Create alert" makes a Malayalam draft from `lib/alertTemplate.ts`. |
| `/alerts` | public | Published alerts, newest first. Admin (PIN unlocked on /dashboard) also sees drafts and can edit + "Approve and publish". |
| `/tasks` | admin PIN | Follow-up tasks (one per published alert: "Visit Ward N houses") with a done checkbox. |

## How AI tools were used

The app was built with Devin (Cognition AI) from a written spec. See `AI_USAGE.md`.

## Privacy

Tables hold only `ward` and timestamps. The 10-minute report cooldown uses the phone's
localStorage plus an httpOnly cookie that contains only an HMAC-signed timestamp (signed with
`REPORT_COOKIE_SECRET`, falling back to the service-role key). Nothing identifying is stored.
Clearing cookies resets the cooldown; that is an accepted limit of a no-personal-data design.
