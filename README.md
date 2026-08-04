# Keep & Cook

Keep & Cook is a Next.js + Supabase app for saving personal recipes in a searchable dashboard.

## What it includes

- Email/password authentication with signup, login, forgot password, and reset password flows
- Private dashboard for creating, editing, favoriting, and browsing recipes
- User-owned collections, faceted tags, imported metadata, and first-party recipe images
- Installable PWA with a versioned, read-only offline recipe snapshot
- Account settings for profile name, password changes, and signing out other sessions
- Marketing landing page with metadata, Open Graph image, robots, and sitemap

## Tech stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and Storage

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

This repo tracks the complete database schema in `supabase/migrations/`. The
`20260804_recipe_model_v2.sql` migration replaces the fixed category enum with
many-to-many collections, adds tags and import metadata, creates an atomic
`save_recipe` function, and configures the `recipe-images` Storage bucket.

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

Before pushing the model-v2 migration to a database that already has recipes,
check for duplicate source links. The new uniqueness rule intentionally fails
instead of silently deleting user data:

```sql
select user_id, source_url, count(*)
from public.recipes
where source_url is not null
group by user_id, source_url
having count(*) > 1;
```

Resolve any returned rows, then run `npx supabase db push`. No bucket or RLS
policy needs to be created manually; the migration does that work.

The migration also rejects legacy external `image_url` values. The previous app
did not persist imported preview images, so this is normally empty. If your
database contains manually populated external image URLs, clear or migrate
those rows before `db push`; all newly imported images are copied to the
`recipe-images` bucket automatically.

## PWA and offline behavior

PWA v1 is intentionally read-only offline. A successful dashboard load stores
a versioned per-user snapshot in IndexedDB, while the service worker caches the
visited shell and recipe images. All mutations still require a confirmed
Supabase response. See `docs/pwa-v1.md` for cache-versioning and cooking-timer
rules.

`db reset` is the key confidence check: it rebuilds the local database from migrations, so you know the schema is reproducible.

## Launch notes

- `npm run build` now uses webpack as the default production build path because it is stable in this project.
- `npm run build:turbopack` is kept as an explicit opt-in check while Turbopack behavior is being evaluated.
- Before deploying, run `npm run predeploy`.
- Before deploying, make sure Supabase Auth has the correct Site URL and password reset redirect URL for your real domain.
- Before deploying, set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SUPPORT_EMAIL` to real production values.
- Before deploying, push the committed schema migration with `npx supabase db push`.
