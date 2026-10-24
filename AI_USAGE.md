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
