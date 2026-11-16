# Keep & Cook

Keep & Cook is a Next.js + Supabase app for saving personal recipes in a searchable dashboard.

Product concept, architecture, design direction, roadmap and the task list live in [`docs/`](docs/README.md).

## What it includes

- Email/password authentication with signup, login, forgot password, and reset password flows
- Private recipe grid with search, URL import, manual entry, editing and cooking mode
- Recipe detail pages with source attribution, imported metadata and first-party images
- Installable PWA with a versioned, read-only offline recipe snapshot
- Account settings for JSON export, password, theme, other sessions, deletion and legal links
- Landing page with a URL demo, Chrome extension introduction and final signup action

## Tech stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and Storage

## Chrome extension prototype

The unpacked Chrome extension lives in `extension/`. It provides a recipe side
panel, cooking over the entire source page (with a standalone tab fallback),
text downloads, and a handoff to the existing library review/save flow. See
`extension/README.md` for installation and manual acceptance checks. Saving uses
the existing `/login` page and an extension content script; no deployment of
`/extension-import` is required for this compatible handoff.

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
# UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your-upstash-rest-token
# NEXT_PUBLIC_POSTHOG_KEY=phc_your_eu_project_token
```

`NEXT_PUBLIC_SITE_URL` should match the deployed app origin so email auth redirects land on the right host.
Set both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` on every production instance to share import and image rate limits. Leave both unset for local development to use process memory. An incomplete pair or an unavailable configured Redis returns 503 for these operations; the app does not fall back to separate per-instance counters.
`NEXT_PUBLIC_SUPPORT_EMAIL` is the contact address shown in legal pages, the footer, and settings. Without it, settings links to this repository's issue form for support.
`NEXT_PUBLIC_POSTHOG_KEY` enables optional web analytics only in production builds. Use a PostHog Cloud EU project token and the EU ingestion region. Events are sent only after the visitor chooses Allow; this choice can be changed in Settings. Development builds never send analytics. In the PostHog project, keep session recordings, autocapture, error tracking, and feature flags disabled, and set the spending limit to zero as specified in `docs/specs/analytics-events.md`.
To verify W-08 after deployment, use a test account in a fresh browser profile: allow analytics, import a URL, sign up or sign in, save and open a recipe, start and finish cooking mode, then export JSON. Confirm the named events and enum properties in PostHog EU Activity, and inspect a captured event to ensure no recipe content, email, or source URL was transmitted. Repeat after choosing Decline in Settings and confirm no new events arrive. Review the published Privacy Policy and PostHog data retention/deletion settings before enabling the project token.
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
`20260805_converge_legacy_recipe_schema.sql` safely brings older production
installations to the same model while preserving their legacy compatibility
columns and favorites table shape.
`20261113_stop_default_recipe_collections.sql` starts new accounts with zero
collections. It does not change collections already owned by existing users.

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

## Import abuse limits

`POST /api/recipes/import` is reachable without an account because the landing
page demo depends on it, so it is rate limited in `src/lib/rate-limit.ts`:

- anonymous callers: 8 imports per 10 minutes, keyed by client address
- signed-in callers: 30 imports per 10 minutes, keyed by user id
- `POST /api/recipes/images`: 40 images per 10 minutes per user

Anonymous imports also use the cheaper `preview` image preset: a smaller input
cap and a single encode pass, so an unauthenticated request cannot spend much
CPU or memory. Signed-in imports use the `stored` preset and upload to Supabase
Storage.

The limiter uses Upstash Redis when both server-only credentials above are set. Its sliding window is approximate at window boundaries; the request budgets remain 8, 30, and 40 per 10 minutes. Without credentials, local development uses an in-memory sliding window.

Known limits of this approach:

- without Upstash credentials, counters live in process memory, so separate
  local server instances have independent limits.
- address keying is blunt: visitors behind one carrier-grade NAT address share a
  budget. Raise `ANONYMOUS_IMPORT_LIMIT` if legitimate visitors report 429s.
- the address comes from `x-forwarded-for`, which Vercel overwrites with the real
  client chain. Behind a proxy that does not normalize that header, or in local
  development, a caller can spoof it and bypass the limit.

In development only, an import response also carries `imageDropReason` when a
picture was found but could not be processed, so a missing image can be
diagnosed without reading server logs.

## Launch notes

- `npm run build` now uses webpack as the default production build path because it is stable in this project.
- `npm run build:turbopack` is kept as an explicit opt-in check while Turbopack behavior is being evaluated.
- Before deploying, run `npm run predeploy`.
- Before deploying, make sure Supabase Auth has the correct Site URL and password reset redirect URL for your real domain.
- Before deploying, set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SUPPORT_EMAIL` to real production values.
- Before deploying, push the committed schema migration with `npx supabase db push`.
