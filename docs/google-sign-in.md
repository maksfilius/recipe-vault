# Google sign-in: owner setup

The code is in place (`/auth/callback`, "Continue with Google" on `/login` and `/register`), but the
button stays hidden until `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`. Do the steps below first. No secret
goes into the repository or into Vercel: the Google Client Secret lives only in Supabase.

## How it works

1. `/login` or `/register` calls `supabase.auth.signInWithOAuth({ provider: "google" })` with
   `redirectTo = <origin>/auth/callback?next=<destination>`. The browser client stores the PKCE
   verifier in the `recipe-vault-auth-code-verifier` cookie. Before leaving, the page checks that
   Supabase answers with a redirect; a disabled or misconfigured provider shows
   "Google sign-in isn’t available right now" instead of a raw error page.
2. Google → `https://<project-ref>.supabase.co/auth/v1/callback` → `<origin>/auth/callback?code=…`.
3. `src/app/auth/callback/route.ts` calls `exchangeCodeForSession(code)` with the server client, which
   writes the session cookie, and redirects (relative `Location`) to the destination. `next` goes
   through `getImportAuthDestination()`, so only `/dashboard…` and `/dashboard/settings` are possible.
4. Cancel at Google → `/login?auth_error=cancelled`; any other failure → `/login?auth_error=failed`.
5. The recipe waiting to be saved (from the extension or the homepage preview) is in this tab's
   `sessionStorage`, which survives the redirects; the extension also keeps its 7-day `localStorage`
   copy. `/dashboard` opens it in the editor as after an email sign-in.

## 1. Google Cloud

1. https://console.cloud.google.com → create or pick a project for Keep & Cook.
2. **Google Auth Platform → Branding** (OAuth consent screen):
   - App name `Keep & Cook`, support email, app logo (`extension/icons/icon-128.png` works).
   - App domain: home `https://keepandcook.com`, privacy `https://keepandcook.com/privacy`,
     terms `https://keepandcook.com/terms`.
   - Authorized domains: `keepandcook.com` and `<project-ref>.supabase.co`.
3. **Audience:** User type *External*. While *Testing*, only listed test users can sign in;
   **Publish app** before launch. With only the basic scopes below, Google does not require review.
4. **Data access (scopes):** `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`. Nothing else.
5. **Clients → Create client → Web application**, name `Keep & Cook (Supabase)`:
   - Authorized JavaScript origins: `https://keepandcook.com`, `http://localhost:3001`.
   - Authorized redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback` (copy it from
     Supabase in step 2.2; it is the only redirect URI Google needs).
6. Copy the **Client ID** and **Client Secret**. Keep the secret out of chat, email and the repo.

## 2. Supabase (production project)

1. **Authentication → URL Configuration**
   - Site URL: `https://keepandcook.com`
   - Redirect URLs (add all):
     - `https://keepandcook.com/**`  (covers `/auth/callback`, which email sign-up confirmation links also use)
     - `http://localhost:3001/**` (local development)
     - Vercel previews, if you test there: `https://*-<vercel-team>.vercel.app/**`
2. **Authentication → Sign In / Providers → Google:** enable, paste Client ID and Client Secret,
   save. Copy the *Callback URL* shown there into Google (step 1.5).
3. Leave "Allow manual linking" off. Supabase links a Google sign-in to an existing account with the
   same verified email automatically (see below); no extra tables or user records are created.

## 3. Vercel

- Production (and Preview, if used): `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` → **Redeploy**
  (`NEXT_PUBLIC_*` values are built into the bundle).
- Local: add `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` to `.env.local` and restart `next dev` on port 3001.

## Existing email/password accounts

Supabase links identities by email: when someone who registered with email and password (and
confirmed the address) signs in with Google using the same Gmail address, Supabase adds a Google
identity to the **same** user, so the user id and all recipes stay the same, and the password keeps
working. If the email account was never confirmed, Supabase removes the unconfirmed password identity
when the Google identity is linked, to prevent account pre-hijacking; that user signs in with Google
from then on (or resets the password). This could not be tried locally without real Google
credentials; check it in the acceptance run below.

## Acceptance run after setup (production or localhost:3001)

- [ ] New user: Continue with Google on `/register` → `/dashboard`, empty library.
- [ ] Returning user: sign out, Continue with Google on `/login` → same library.
- [ ] Existing email/password user (confirmed) → Google with the same address → same recipes; the
      password still signs in. Supabase → Authentication → Users shows one user with two identities.
- [ ] Extension: Save to my recipes while signed out → Continue with Google → editor opens with that recipe.
- [ ] Homepage: paste a link (or Try an example) → Save to my free cookbook → Continue with Google →
      editor opens with that recipe.
- [ ] Cancel on Google's account chooser → back on `/login` with "Google sign-in was cancelled",
      the draft message still shown.
- [ ] Sign out from the account menu → `/login`; `/dashboard` redirects to sign-in again.
- [ ] Email/password sign-in and registration still work.
- [ ] `/login` and `/register` on a phone: the Google button and form fit without scrolling sideways.
