# Keep & Cook

Keep & Cook is a Next.js + Supabase app for saving personal recipes in a searchable dashboard.

## What it includes

- Email/password authentication with signup, login, forgot password, and reset password flows
- Private dashboard for creating, editing, favoriting, and browsing recipes
- Account settings for profile name, password changes, and signing out other sessions
- Marketing landing page with metadata, Open Graph image, robots, and sitemap

## Tech stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres

## Environment

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=support@example.com
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=Keep & Cook <onboarding@resend.dev>
RESEND_TEST_TO_EMAIL=you@example.com
RESEND_TEST_TOKEN=replace-with-a-long-random-token
```

`NEXT_PUBLIC_SITE_URL` should match the deployed app origin so email auth redirects land on the right host.
`NEXT_PUBLIC_SUPPORT_EMAIL` is the contact address shown in legal pages and the footer.
`SUPABASE_SERVICE_ROLE_KEY` is required if you want the in-app account deletion flow enabled.
Replace `re_xxxxxxxxx` with your real Resend API key before sending email.
`RESEND_FROM_EMAIL` should use a verified sender in production, such as `Keep & Cook <hello@your-domain.com>`.

The sample Resend endpoint is available at `POST /api/email/test` and sends the "Hello World" email from the Resend quickstart. It is disabled unless `RESEND_TEST_TOKEN` is set and requires a bearer token:

```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Authorization: Bearer replace-with-a-long-random-token"
```

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test:unit
npm run test
npm run build
npm run build:turbopack
npm run build:webpack
npm run predeploy
```

`npm run test` runs linting, TypeScript validation, and a small unit test suite.
`npm run predeploy` is the recommended final local check before shipping.

## Supabase notes

- Enable Email auth in Supabase.
- If email confirmation is enabled, users will see a check-email state after signup instead of being sent into the dashboard immediately.
- Password recovery emails should redirect to `/reset-password`.
- The dashboard server gate depends on Supabase SSR auth cookies plus the app middleware keeping them refreshed.
- If you want self-serve account deletion in settings, set `SUPABASE_SERVICE_ROLE_KEY` on the server.

## Database schema and migrations

This repo now tracks the database schema in `supabase/migrations/20260418_initial_schema.sql`.

Why this matters:

- the app depends on `recipes` and `favorite_recipes` existing with the expected columns
- RLS policies are part of the app's behavior, not just a dashboard setting
- a new Supabase project can be recreated from code instead of manual clicks

Suggested learning flow with the Supabase CLI:

```bash
npx supabase init
npx supabase start
npx supabase db reset
```

Useful follow-up commands:

```bash
npx supabase migration new add_some_change
npx supabase db diff -f describe_dashboard_changes
npx supabase db push
```

`db reset` is the key confidence check: it rebuilds the local database from migrations, so you know the schema is reproducible.

## Launch notes

- `npm run build` now uses webpack as the default production build path because it is stable in this project.
- `npm run build:turbopack` is kept as an explicit opt-in check while Turbopack behavior is being evaluated.
- Before deploying, run `npm run predeploy`.
- Before deploying, make sure Supabase Auth has the correct Site URL and password reset redirect URL for your real domain.
- Before deploying, set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SUPPORT_EMAIL` to real production values.
- Before deploying, push the committed schema migration with `npx supabase db push`.
