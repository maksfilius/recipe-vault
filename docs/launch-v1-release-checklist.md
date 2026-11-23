# Launch v1: release checklist

Audit date: 2026-11-23, at commit `88ea721` (main). Covers the Chrome extension v0.2.0, the web app and PWA at `https://keepandcook.com`, and the Chrome Web Store package.

Severity:
- **P0** blocks the public launch: data loss, a broken core journey, a Chrome Web Store policy risk, or a journey nobody has run end to end yet.
- **P1** fix before or right after launch. It hurts trust or measurement but loses no data.
- **P2** polish, or work that belongs to a later phase.

## 1. What was actually executed

| Check | Command / method | Result |
|---|---|---|
| Lint | `npm run lint` | ✅ pass |
| Typecheck | `npm run typecheck` | ✅ pass |
| Unit tests | `npm run test:unit` | ✅ 124/124 pass |
| Production build | `npm run build` (webpack) | ✅ pass, 22 routes |
| Extension pack on HEAD | `npm run pack:extension` | ❌ refused: HEAD is not tagged `extension-v0.2.0`. This is the script's guard, not a defect. |
| Extension pack at its tag | Temporary worktree at `extension-v0.2.0`, `node scripts/pack-extension.mjs` | ✅ 20 files, 277 KB. No README or preview files. `extension/` is unchanged between the tag and HEAD. |
| Store asset sizes | `sips` on `docs/store/*` | ✅ 4 screenshots at 1280×800, promo tile at 440×280 |
| Production pages | `curl` GET of `/`, `/privacy`, `/extension/welcome`, `/sitemap.xml`, `/manifest.webmanifest`, `/sw.js` | ✅ all 200 |
| Production import API, page with no recipe | `curl` POST `/api/recipes/import` with `https://example.com/` | ✅ 422 with "We couldn’t find a complete recipe on this page." |
| Production privacy contact | `curl /privacy` | ❌ shows the placeholder "set `NEXT_PUBLIC_SUPPORT_EMAIL` before launch" (see P0-2) |
| Extension handoff with an empty description | Node harness that runs `extension/library-handoff.js` with a stubbed `location` and storage | ❌ draft dropped (see P0-1) |

**Not executed** (no browser session, no test account, no Android or iPhone device):
- Load unpacked of the packed zip, any real browser run of the side panel, the cooking overlay or the fallback tab.
- Sign-up, email confirmation, login, saving, reload persistence and a second device against production.
- PWA install on iPhone or Android, and the Android share target.
- Production Supabase Auth settings, Vercel env (Upstash, PostHog) and PostHog event intake.

Earlier verification docs (`d14-verification.md`, `m0x-verification.md`, `design-extension-*.md`) record browser checks done by previous tasks. They predate the last 10 commits and none of them covers journeys 3–7 end to end against production.

## 2. Journey status

| # | Journey | Code path | Status |
|---|---|---|---|
| 1 | Recipe site → extension → readable recipe | `background.js` → `panel.js` `readPage()` → `extract.js` (JSON-LD, microdata), otherwise `POST /api/recipes/import` | Code reviewed. Extraction is unit-tested (`tests/extension.test.mts`). **Not run in a browser this audit.** |
| 2 | Cooking mode → steps → close → back on the source | `panel.js` cook handler → `reader.js` overlay (shadow DOM, `close()` releases the wake lock). Fallback: `cooking.html` with `chrome.storage.session` | Code reviewed. The overlay sits on the source tab, so closing it leaves the user on the source. **Not run.** |
| 3 | Save → sign up → confirm email → review → save → library | `shared.js libraryUrl()` → `/login#keep-and-cook-import=` → `library-handoff.js` → `AuthForm` `signUp({emailRedirectTo: /dashboard})` → `useDashboardImport` → `useDashboardActions.handleFormSubmit` | **Broken for some recipes (P0-1).** Depends on unverified production Auth config (P0-4). Never run end to end (P0-5). |
| 4 | Save while signed in → review → library | `/login` server-redirects a signed-in user to `/dashboard`. The fragment survives the 307 and the content script reads it there. | Same P0-1 defect. **Not run.** |
| 5 | Save a recipe already in the library | `resolveExistingRecipe` before saving, plus the `23505` fallback → "This recipe is already in your library." | Unit-tested (`recipe-import-existing.test.mts`). Matching is an exact `source_url` match, so P1-1 applies. **Not run.** |
| 6 | Reload → the recipe is still there | Supabase `save_recipe` RPC, RLS | **Not run.** |
| 7 | Second device → the recipe shows up | Same data, per-user RLS. The offline snapshot is per device. | **Not run.** |
| 8 | Unsupported site → honest, recoverable error | `panel.js` states `no-recipe`, `access-error` and `extraction-error`, with "Read this page" and "Add manually on web" | Verified against the production API (422 → "No recipe found"). Panel UI **not run.** |

## 3. Findings

### P0: release blockers

**P0-1. Save silently drops recipes that have no description.**
- Source: `extension/library-handoff.js:12` requires `description` to be a non-empty string. The server parser returns `description: ""` when a page has neither a recipe description nor a usable meta description (`src/lib/recipe-import-parser.ts`, `buildImportedRecipe`). The panel accepts that recipe and shows it, because `panel.js` checks only the title, ingredients and steps. On Save, `validate()` throws, the error goes only to `console.error`, and the user lands on `/login` or `/dashboard` with no draft and no message. The web schema already treats the description as optional (`recipePayloadSchema`, `optionalText`). Only the extension's validator is stricter.
- The extension's own `extract.js` path is safe: it falls back to `Recipe from <host>`.
- Repro: `node <harness> extension/library-handoff.js` with `description: ""` prints `pending stored: false | errors: Invalid recipe description.`
- Fix: accept an empty or missing description (≤ 5000 characters) in `validate()`, plus a regression test in `tests/extension-handoff.test.mts`. This changes `extension/`, so release as **0.2.1** (manifest version bump, tag `extension-v0.2.1`).

**P0-2. Production privacy policy has no contact address.**
- Source: `src/app/privacy/page.tsx:164-180`. `NEXT_PUBLIC_SUPPORT_EMAIL` is unset in production, and the live page says "set `NEXT_PUBLIC_SUPPORT_EMAIL` before launch". The store listing plans to use `/privacy#contact` as the support URL.
- Fix (owner): set `NEXT_PUBLIC_SUPPORT_EMAIL` in Vercel Production and redeploy. No code change.

**P0-3. The store listing promises a feature the product hides.**
- Source: `docs/chrome-web-store.md` STEP 3: "sort them into collections like Breakfast or Dinner". `architecture.md` and M-02/M-07 say collections are hidden in the minimal UI, and new accounts get none. Chrome Web Store policy treats misleading functionality claims as grounds for rejection.
- Fix: rewrite the description (Phase 3). The listing name and summary in `manifest.json` also differ from the target positioning ("Recipe Saver & Cookbook" vs "Recipe Saver & Reader"). That is decided in Phase 3 and ships in 0.2.1 together with P0-1.

**P0-4. Production Supabase Auth config is unverified (journey 3).**
- Source: `AuthForm.tsx` sends `emailRedirectTo: <origin>/dashboard`. The repo's `supabase/config.toml` is local only (`site_url = 127.0.0.1`, `enable_confirmations = false`). There is no `/auth/callback` route: the PKCE `?code=` exchange relies on the browser client on `/dashboard`.
- Risk: if `https://keepandcook.com/dashboard` (or `https://keepandcook.com/**`) is missing from Redirect URLs, Supabase sends the user to the Site URL instead. `library-handoff.js` restores the 7-day draft copy only on a full load of `/dashboard`, so the draft would not reappear in the new tab.
- Fix (owner, read-only check): Supabase Dashboard → Auth → URL Configuration (Site URL `https://keepandcook.com`, redirect allow-list), and confirm that "Confirm email" is on as intended. Record the result here.

**P0-5. No end-to-end run of journeys 1–8 on the packed build against production.**
- No E2E suite exists (W-11 is open). E-09/E-10 still list "Load unpacked of the zip and first install" as owner-pending (`tasks.md`, status on 16.11).
- Gate: after the P0-1 fix, run section 5 manually on `dist/extension` with a fresh test account and record pass/fail with dates. Until then, journeys 1–8 are **not passed**.

### P1

| ID | Finding | Source | Fix |
|---|---|---|---|
| P1-1 | Duplicate check misses fragment variants. The extension sends `location.href` with its `#fragment`; "Jump to recipe" links often add `#wprm-recipe-container-…`. URL import strips the fragment (`recipe-import-url.ts:90`). The same recipe saved both ways gets two different `source_url`s, so two library entries. | `extract.js` `sourceUrl: location.href` | Strip the hash in `extract.js` (one line, ships in 0.2.1). Existing rows stay as they are. |
| P1-2 | A failed handoff is silent. Any validation failure, such as an oversized heuristic import, only logs to the console, and the user sees an empty login page. | `library-handoff.js` catch | After P0-1, stage a small error flag the dashboard turns into a notice, or document it as accepted. |
| P1-3 | Shared rate limit unverified in production. Without the Upstash env, limits are per instance (in-memory). | `src/lib/rate-limit.ts`, W-02 | Owner checks the Vercel env. |
| P1-4 | No error monitoring. | W-09 | Sentry or equivalent, owner DSN. |
| P1-5 | PostHog key and intake unverified in production. The extension has no analytics, so install, extraction and the panel Save click cannot be measured. | `analytics.ts`, privacy page "The extension does not use analytics" | Phase 5. |
| P1-6 | ~~Store screenshot 1 shows the real panel over a fictional fixture site.~~ **Resolved in Phase 3:** new frames show only real Keep & Cook UI with a local demo cookbook, with no host site. | `docs/chrome-web-store.md` | — |
| P1-8 | ~~The store icon is opaque across all 128×128 px.~~ **Fixed:** `icon-128.png` is now a 96×96 tile with 16 px transparent padding. The panel header uses the unchanged full-bleed `mark-128.png`. | `scripts/generate-icons.mjs` | — |
| P1-9 | ~~ISO durations given in seconds (`PT5400S`, e.g. thekitchn.com) were shown and saved raw.~~ **Fixed** in the server parser and `extension/extract.js`, so they now read "1 hr 30 min". | `recipe-import-parser.ts`, `extract.js` | Tests in `recipe-import-parser.test.mts` and `extension.test.mts` |
| P1-7 | Release mechanics: a fix in `extension/` needs a version bump and a new tag, and pack must run on that tagged commit. | `scripts/pack-extension.mjs` | Follow the section 4 steps. |

### P2

| ID | Finding | Source |
|---|---|---|
| P2-1 | After an `access-error`, clicking the toolbar icon again does not re-read the page. The user has to press "Read this page". | `background.js` `onClicked` only opens the panel |
| P2-2 | No canonical URLs. The sitemap lists `/login`, `/register` and `/forgot-password` but none of the planned `/chrome-extension` and `/install`. The OG description is generic. | `src/app/sitemap.ts`, `layout.tsx` (Phase 4) |
| P2-3 | The panel never shows a "Saved" or "Already saved" status (E-07, "Should after publish" in ADR 001). | `panel.js` `showSaveFeedback` used only in preview |
| P2-4 | Server heuristic fallbacks (`extractIngredientsFallback`, `extractStepsFallback`) were not checked against the handoff limits (100 items, 200 characters). | `recipe-import-parser.ts` |
| P2-5 | Signed-in dashboard on a phone, keyboard and screen-reader passes, and the Android share target are not verified. | `d14-verification.md`, W-12 |
| P2-6 | Two cooking modes (`CookingMode.tsx`, `reader.js`) must be kept in sync. | `architecture.md` tech debt #3 |

## 4. Chrome Web Store requirements (state today)

| Item | State |
|---|---|
| Permissions | `activeTab`, `scripting`, `sidePanel`, `storage`; host `https://keepandcook.com/*` only. Minimal, with justifications written in `chrome-web-store.md`. ✅ |
| Remote code | None. CSP `script-src 'self'`, all JS in the package. ✅ |
| Single purpose | Written. ✅ |
| Privacy policy | Has an Extension section that matches the code (page URL sent only when no structured data is found, fragment handoff, no analytics). ❌ No contact address (P0-2). |
| Data disclosure | "Website content" only. Matches `panel.js` (URL to the import API) and the handoff. ✅ |
| Listing text | ✅ Rewritten in Phase 2 (P0-3), with no unavailable features. |
| Screenshots / tile | ✅ Phase 3: four 1280×800 frames and a 440×280 tile, real UI only. Icon padding: P1-8. |
| Support / website URL | `https://keepandcook.com`. Support depends on P0-2. |
| Package | Builds from the tag. A new version is needed for P0-1 and P1-1. |

Release steps after the fixes: `manifest.json` is already `0.2.1` → commit → section 5 on an unpacked copy → `git tag extension-v0.2.1` on that verified commit → `npm run pack:extension` → Load unpacked `dist/extension` → section 5 → upload as **Unlisted** → re-run journeys 1–4 from the store install → Public → set `NEXT_PUBLIC_CHROME_EXTENSION_URL` and redeploy. Publishing needs explicit owner approval.

## 5. Manual verification procedure (release gate)

Run on the packed `dist/extension` in a clean Chrome profile against production with a new test account. Record the date, the result and the URL used.

1. **Read.** Open a JSON-LD recipe page (for example an allrecipes.com recipe) and click the icon. The panel shows the photo, title, ingredients and steps. Repeat on a page with no description; it must also show a recipe.
2. **Cook.** Start cooking, move forward and back through the steps, start a timer, then close. You are back on the source page with no overlay left behind. On a site that blocks the overlay, a `cooking.html` tab opens.
3. **Save + sign up.** Signed out, click Save. `/login` shows "Your recipe draft is waiting". Create an account and confirm the email by opening the link in the same browser. The new tab opens the editor with the draft. Save; the recipe appears in the library.
4. **Save signed in.** On another recipe, click Save. The editor opens directly. Save; it appears in the library.
5. **Duplicate.** Save the recipe from step 4 again. You see "This recipe is already in your library" and the existing recipe opens. Repeat after clicking "Jump to recipe" on the source page (P1-1).
6. **Persist.** Hard-reload `/dashboard`. Both recipes are still there.
7. **Second device.** Sign in on a phone or in another browser. Both recipes are there. Install the PWA (iOS: Share → Add to Home Screen; Android: Install app) and open a recipe in cooking mode.
8. **Unsupported.** Open `https://example.com/` and click the icon. You see "No recipe found" with "Add manually on web". On `chrome://extensions` you see "Page access needed".
9. **No-description recipe (P0-1 regression).** Use a page that falls through to the server parser and has no meta description. Save opens the editor with the draft.
10. **Fragment duplicate (P1-1 regression).** On a saved recipe page, click "Jump to recipe" (the address gains `#…`), open the panel and click Save. The editor's Save opens the existing recipe with "already in your library".
11. **Failure explanation (P1-2).** Hard to trigger with a real page. Covered by the unit test; optionally open `https://keepandcook.com/login#keep-and-cook-import=%7B%7D` with the extension installed and confirm the red alert.

## 6. Phase 2 fixes (2026-11-23, uncommitted on main, extension 0.2.1 untagged)

| Finding | Change | Regression test |
|---|---|---|
| P0-1 | `extension/library-handoff.js`: `description` is optional (missing or a string ≤ 5000), as in `recipePayloadSchema`. Title, ingredients, steps and `sourceUrl` checks are unchanged. | `extension-handoff.test.mts`: empty and missing descriptions reach the editor; broken required fields are still rejected; a server-parsed recipe with no description goes through `buildImportedRecipe` → `libraryUrl` → handoff → `createDraftRecipe` → `recipePayloadSchema` → `toSaveRecipeRpcArgs` (`p_description: null`). |
| P1-1 | `withoutUrlFragment()` in `src/lib/recipe-validation.ts`: the `sourceUrl` schema strips the fragment before saving, and `resolveExistingRecipe` strips it before every duplicate lookup (URL import and editor Save). `extension/extract.js` sends `location.href` without its fragment. The rest of the URL is kept byte for byte, so existing rows still match. | `recipe-validation.test.mts`, `recipe-import-existing.test.mts` (`#wprm-recipe-container-12` and `#comments` resolve to the saved recipe), `extension.test.mts` (extractor drops the fragment) |
| P1-2 | A failed handoff sets `keep-and-cook:pending-recipe-error` and removes the payload from the address bar. `/login` and `/register` show a persistent alert; `/dashboard` shows an error notice and sends `extension_handoff_failed {reason: unknown}`. An extension draft that fails the dashboard schema gets the same message instead of "preview expired". | `extension-handoff.test.mts`: a failed transfer sets the flag and strips the fragment |
| P0-3 | Listing copy rewritten in `docs/chrome-web-store.md`; manifest name and summary changed to "Keep & Cook — Recipe Saver & Reader" and the approved short description (101 characters). | Each claim mapped to source files in the doc |

All 6 new failure-path tests were run against the pre-fix code and failed there, then passed with the fixes.

Checks after the changes: lint ✅, typecheck ✅, unit tests ✅ 131/131, `npm run build` ✅. `npm run pack:extension` refuses on purpose (no `extension-v0.2.1` tag yet). A dry pack of a copy of `extension/`, with only the tag and clean-tree guards removed, produced 20 files (277 KB). The manifest in that zip says 0.2.1 with the new name, and no README, preview or `.DS_Store` files are included.

Remaining after Phase 2:
- Rows saved with a fragment before 0.2.1 keep it, so they will not match a fragment-free save. The extension was never published, so this only affects test data.
- On `/dashboard` the failure notice is the existing toast, which auto-hides after 3.2 s. The sign-in pages show a persistent alert.
- P0-2, P0-4 and P0-5 still need the owner. P1-3…P1-6 and the P2 items are unchanged.

## 7. Phase 3–4: store graphics and website (2026-11-23)

**Store graphics.** `docs/store/1-read.png`, `2-cook.png`, `3-save.png` and `4-devices.png` are 1280×800, plus `promo-tile-440x280.png`. All are 24-bit PNG with no alpha. They are built from real captures:
- Extension pages run unchanged with stubbed `chrome.*` APIs.
- Web screens come from the app signed in to a demo account on a local Supabase.

The old JPGs with the fictional host site are removed. Scripts live in `scripts/store/`, and reproduction steps are in `chrome-web-store.md`. They were checked against the current Chrome Web Store docs (sizes, full bleed, no misleading content, 132-character summary), and the store icon padding gap was found (P1-8).

**Website.** All `(marketing)` pages share a layout (header and footer).
- **Home:** new headline "Save recipes. Cook without distractions." The URL demo is unchanged. New sections cover the three ways to save (link, Chrome, by hand), the extension (with a real panel screenshot instead of the illustration), and the cookbook on every device (laptop and phone cooking mode).
- **New pages:** `/chrome-extension` (features, setup steps, where it works, privacy) and `/install` (iPhone/Safari and Android/Chrome steps, what works offline).
- **Metadata:** each page has its own title, description, canonical URL and Open Graph tags. The sitemap lists `/`, `/chrome-extension`, `/install`, `/register`, `/login`, `/privacy` and `/terms`.
- **Removed:** the unused `Features.tsx` (it claimed collections and tags), and "meal planning" from the site keywords.
- **Store button:** "Add to Chrome" is disabled, with "Coming soon to the Chrome Web Store", until `NEXT_PUBLIC_CHROME_EXTENSION_URL` is set.

**Verified:**
- lint ✅, typecheck ✅, unit tests ✅ 131/131, `npm run build` ✅ (`/chrome-extension` and `/install` are static).
- On the local dev server, all internal links and images return 200, and each page has one `h1` and a canonical tag.
- Full-page captures at 1440 and 390 px in light and the default dark theme show no horizontal overflow. Before: `docs/screenshots/launch-before-*`. After: `docs/screenshots/launch-after-*`.

**Not verified:** keyboard and screen-reader pass, a real iPhone or Android install following `/install`, and production deployment.

## 7a. Landing demo result (2026-11-23)

`src/components/landing/Hero.tsx`: a successful preview now shows the photo (when present), title, time and servings, a link to the original, the first 6 ingredients and the first 3 steps (long steps clamped to 4 lines). "Show full recipe" expands everything, and "Save to my free cookbook" is the primary action. The draft transfer is unchanged: `keepDraft()` writes the draft to sessionStorage, then the user goes to `/dashboard`, through login if needed, and lands in the review editor. "Try an example" loads `SAMPLE_RECIPE_URL` (`src/lib/sample-recipe.ts`, shared with the extension welcome page). Missing photo, time, servings, ingredients or steps simply don't appear, and the missing-content note explains what's absent.

Checked with `scripts/store/capture-hero-import.mjs` against a running app:
- The example loads 9 ingredients and 7 steps, and expanding shows all of them.
- The Save link goes to `/dashboard`.
- There is no horizontal overflow at 1440 or 390 px, collapsed or expanded.
- `https://example.com/` shows "We couldn’t find a complete recipe on this page."
- Screenshots: `docs/screenshots/hero-import-{light,dark}-{desktop,mobile,mobile-expanded,mobile-error}.png`.

The parsing API and database schema are unchanged. The only parser change is P1-9.

## 8. Release readiness

**Not ready to publish.** The code, listing copy, store graphics and website are prepared and pass all local checks. Still open before tagging `extension-v0.2.1`:
- P0-2: set the production support email.
- P0-4: check Supabase Auth URL configuration.
- P0-5: run and record section 5 on the packed build.

The website changes are on `main` but not deployed. After the store approves the listing, set `NEXT_PUBLIC_CHROME_EXTENSION_URL` and redeploy to turn on "Add to Chrome".
