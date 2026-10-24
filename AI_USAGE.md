# AI usage

This project was built for a hackathon with heavy use of AI coding tools. Being open about it:

- **Devin (Cognition AI)** wrote the code, SQL schema, Malayalam UI strings, and docs from a
  spec written by the team (pages, data model, rules, colours, order of work).
- Work was done in three reviewed steps, each as a pull request:
  1. project setup, schema, `/report`
  2. dashboard, red-ward logic, seed data
  3. alerts (template → edit → publish → auto task) and tasks
- The team reviewed each PR, decided the product rules (5 reports in 3 days = RED, one report per
  10 minutes, Malayalam-first), and checked the Malayalam text.
- No AI model runs inside the app. Alert text comes from a fixed template in `lib/alertTemplate.ts`,
  so nothing is generated at runtime and every alert is approved by a human before publishing.
- All data in the app is fake example data created by `scripts/seed.ts`.

## Phase A (accounts, roles, Kerala locations)
Built with Claude (Sonnet 5.5): SQL migration, auth/session code, role guards, register/login/approval pages. Checked with tsc + lint; all demo names are fake.

## Phase B + C (illness reports, targeted alerts, ASHA tasks)
Built with Claude (Opus 5.5): disease-aware reports, ward-targeted alerts, officer dashboard, ASHA accounts and
task assignment. Tested end to end on a Vercel preview in a real browser (every role, plus negative security checks).

## Phase D + E (languages, state admin, design)
Built with Claude (Opus 5.5): English / Malayalam / Hindi for every screen, API error, illness and place name;
alert templates in three languages; new logo and app icons; phone-first layout with a bottom tab bar; state admin
overview. Malayalam and Hindi text was written by the AI and should be reviewed by a native speaker before real use.

## Real places, maps and trends
Built with Claude (Opus 5.5) from the team's list of real panchayats and ward names: migration, ward heat map, Kerala tile map,
7-day trend chart, per-account report limit and WhatsApp share. Tested on a Vercel preview in a real browser. Elected members'
names from the source list were deliberately not stored.
