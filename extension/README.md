# Keep & Cook Chrome prototype

## Install

1. Open `chrome://extensions` in Chrome 116 or later.
2. Enable **Developer mode**, choose **Load unpacked**, and select this `extension` directory.
3. Pin Keep & Cook to the toolbar. Visit a recipe page and click its icon.

The first install (not an update) opens `/extension/welcome` on the website with the same three steps and a sample recipe.

The extension uses Chrome's native side panel. Click the toolbar icon on each new recipe site to grant temporary page access. If the panel stays open while changing tabs, use the toolbar icon again when Chrome requests page permission.

## Release build

1. Bump `version` in `manifest.json`, commit, and tag the commit: `git tag extension-v<version>`.
2. Run `npm run pack:extension`. It refuses to pack without a matching tag or with uncommitted changes in `extension/`.
3. Upload `dist/keep-and-cook-extension-<version>.zip`. Before that, load `dist/extension/` with Load unpacked and run the manual check below.

Icons come from `src/assets/Logo.svg` via `node scripts/generate-icons.mjs`.

## Local website

The extension talks to production by default. To point it at `npm run dev`, without committing the change:

1. In `shared.js`, set `APP_ORIGIN` to `http://localhost:3000`.
2. In `manifest.json`, replace `https://keepandcook.com` with `http://localhost:3000` in `host_permissions`, `content_scripts.matches` and the CSP `connect-src`.
3. Reload the extension in `chrome://extensions`. Save now opens `http://localhost:3000/login#keep-and-cook-import=…`.

## Workflow

- The side panel header contains only the logo. The recipe card has **Save to my recipes** (primary, with a "Free account" hint) and **Start cooking** actions, with a small **Download** link below the method. `Read this page` appears in the empty and error states. Save opens the website for review and closes the panel; it does not claim cloud saving is complete.
- Read ingredients and instructions alongside the original website. Check off ingredients.
- **Start cooking** opens a dialog over the entire source webpage, outside the side panel. It does not use browser fullscreen. If injection fails, a standalone extension tab opens with the same interface and actions. The panel closes after successful injection; **Close** or Escape restores the source webpage.
- Navigation stays at the bottom of the viewport. Large instruction text fills the remaining space. Long steps are split into parts sized to the window, with **Continue step** before **Next step**. Arrow keys navigate. Ingredients open in a separate drawer. Screen wake lock is best effort.
- **Download** exports a `.txt` file with the recipe and source without an account.
- **Save to library** works in the panel, the page-sized cooking view, and its standalone fallback, including after cooking finishes. It opens the existing `https://keepandcook.com/login` page with a marked recipe fragment. `library-handoff.js` runs before application scripts, validates the recipe, and stages it using the existing `keep-and-cook:pending-recipe-import` contract. Signed-in users go to the dashboard; everyone else logs in or registers. The existing editor opens for review, editing, and explicit Save. The photo travels as its https address and the website downloads it on Save; if the source refuses, the recipe is saved without it. The side panel closes after Save so the website tab has the full window.

The website has no `/extension-import` route. Old prototype links to it are recovered by the extension content script and redirected to the login handoff. The script also marks the draft as coming from the extension, so the dashboard reports `extension_handoff_completed` and `recipe_saved {source: extension}`. Reload the extension in `chrome://extensions` after updating, then reload an old 404 page or save again. The extension itself is loaded locally and is not published to the Chrome Web Store.

## Extraction and privacy

Extraction first reads Recipe JSON-LD and schema.org Recipe microdata (with h-recipe `e-instructions` for Jetpack recipes) from the current page, including nested graphs and instruction sections. Time and servings follow the server parser's rules. `node scripts/extension-extract-benchmark.mjs main` measures how many benchmark pages need no server call. If no complete structured recipe exists, the extension calls the existing public Keep & Cook import endpoint with the page URL. This fallback shares the existing anonymous rate limits and may fail on blocked or unsupported sites. It does not send the page HTML or account credentials. Page content is rendered as text, never as HTML in the panel.

Permissions: `activeTab` and `scripting` read the explicitly selected page and open the cooking overlay; `sidePanel` provides the recipe preview; `storage` holds browser-session snapshots for fallback cooking tabs. Persistent host access and the document-start handoff script are limited to `https://keepandcook.com/*`. No Supabase keys or authentication tokens are stored in the extension.

The handoff uses site session storage and keeps the latest unfinished transfer in site local storage for up to seven days for email-confirmation recovery in another tab of the same browser. Recovery is consumed when the dashboard receives the draft; it is not a second saved recipe and never writes to the database itself. This recovery does not follow links opened in a different browser profile/device. Clearing site data removes it. Several simultaneous transfers retain their own same-tab drafts, but cross-tab recovery uses only the latest transfer.

## Manual acceptance check

1. Try a JSON-LD recipe with nested instruction sections and a site requiring server fallback.
2. Switch tabs and navigate; verify stale recipes disappear, the header contains only the logo, and `Read this page` appears on error and no-recipe screens but not on a found recipe.
3. Check ingredients, use the small Download link after the steps, and compare the UTF-8 text file's steps/source.
4. Start cooking over the webpage, navigate a long step through all its parts, resize the window, and check that Previous/Next never leave the viewport. Finish, download/save, and close back to the original page. Also verify both actions from the fallback cooking tab.
5. Transfer a recipe signed in, signed out, and through registration with email confirmation in another tab. Verify that `/login` opens, the editor restores the recipe, Save is required before persistence, and later unrelated dashboard loads do not restore it again.
6. Try an unsupported page, malformed JSON-LD, missing image, and unavailable network.

This is a local prototype: no store packaging, OCR, AI extraction, or automatic saving. The existing application parser remains the richer fallback. Timer controls are now available in cook mode; they do not promise background notifications after the page closes.

## Verification performed

- Regression tests cover direct panel opening, page-reader injection, saving from standalone extension pages, extraction/export, compatible login handoff before app hydration, old-link recovery, cross-tab recovery, and cleanup after SPA login. Tests also cover the separately implemented app draft-transfer helpers.
- `npm run build`: the production build was checked during the extension prototype work. The v1 handoff uses `/login`.
- Headless Chrome previews use the actual cooking renderer/CSS with mocked Chrome APIs and a long Russian illustrative recipe at 1440×900, 390×844, and 900×450. Text fits and navigation remains visible; the long step becomes two or three parts depending on the viewport.
- Browser previews do not verify native side-panel permissions, injection into every recipe website, or authenticated production saving. Those remain the manual acceptance checks above.

The panel and cook mode use the application's light and dark color tokens and a local copy of its Fraunces display font. Current mobile side-panel previews: [recipe found](../docs/screenshots/kc-m10-found.png), [no recipe](../docs/screenshots/kc-m10-no-recipe.png), [parser error](../docs/screenshots/kc-m10-extraction-error.png), [dark recipe](../docs/screenshots/kc-m10-found-dark.png). These are localhost fixtures; native Chrome permissions and authenticated saving still require the manual check above. The signed-in, signed-out, already-saved and saved panel views are design fixtures until the E-02 website handoff returns verified status to the extension.
