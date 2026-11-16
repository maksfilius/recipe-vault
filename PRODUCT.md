# Keep & Cook

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

Keep & Cook turns a recipe discovered on a website into a clear recipe to cook now and, if the user chooses, a private recipe to find later. A single library connects website import, manual entry, the PWA and the Chrome extension. The product keeps the original source visible and asks the user to review imported data before saving.

## Audience and Operating Context

Initial focus: English-speaking home cooks in the US who find a recipe on a website and want ingredients and steps without surrounding clutter. A second segment collects recipes from multiple places and wants to retrieve them for actual cooking. EN is the v1 interface language; do not auto-translate a creator's recipe or silently convert units. US focus guides content and site testing, not access restrictions. Research and segment detail: [`docs/research/audience.md`](docs/research/audience.md).

The production web application is at `https://keepandcook.com/`. The Chrome extension is a local prototype; its v1 experience is specified but not yet shipped. The first useful moment requires no account: preview a website recipe on the landing page or open the extension panel on that page, then cook, print or download. An account is required to save to the cloud library. Mobile users use web/PWA; offline PWA access is read-only to a previously loaded per-user snapshot.

## Entry Points and Core Journey

1. **Web URL preview:** paste a recipe URL → see a complete or explicitly incomplete draft → choose Save → sign in if needed → review in editor → confirmed Save → open recipe card.
2. **Chrome extension:** click the icon on a specific recipe tab → native side panel shows a clean recipe → cook without an account or choose Save → web editor handles authentication, review and final Save. No all-sites auto-detection in v1.
3. **Manual entry:** create or edit a recipe in the web library, with ingredients, steps and source link when available.
4. **Return:** search private recipes, open a card, start cook mode, then return to the same library from desktop or phone.
5. **Later:** Android Web Share Target and YouTube URL import are planned work. Arbitrary TikTok/Instagram import, paid plans and app-store applications are not current capabilities.

## Capabilities and Constraints

- Private user-owned recipes, authentication and server-confirmed writes. Preserve existing manual and URL entry paths while redesigning.
- The current web library shows a simple recipe grid and search. Collections, tags and favorites remain in stored data, while their navigation and controls are hidden in the minimal interface. New accounts start with no collections.
- Cooking in the extension covers the webpage content area with an overlay; a separate tab is the fallback where injection is unavailable. Large readable steps, persistent navigation, ingredient checklist, timers and wake lock are v1 targets. Original servings are shown, without automatic scaling.
- Download as `.txt` and browser Print/Save as PDF in the extension. Settings provides a JSON export of recipes, collections and tags.
- Source URL and attribution remain visible. Missing ingredients, steps, time or servings are never invented. Saving requires review and explicit user action.
- PWA snapshot supports reading and cooking offline. Creation, editing, deleting and other mutations require a confirmed online write.
- Meal planning, shopping list, public social feed, automatic unit conversion, voice control and AI assistant are outside v1.

Functional source of truth: [`docs/specs/extension.md`](docs/specs/extension.md) and [`docs/specs/web.md`](docs/specs/web.md), both approved 10 November 2026. They describe target behavior, not a claim that every feature is already live.

## Brand and Design Direction

Keep & Cook is the product name across web, PWA and extension. The approved visual system uses flat warm cream surfaces, terracotta as the action accent, restrained borders, strong contrast, Fraunces display type and accessible focus states. The tokens and usage rules are in [`docs/design-direction.md`](docs/design-direction.md). Older web screens move to this system through D-02…D-14.

Product voice: direct, calm and useful. Say what was extracted, what is missing, whether a recipe has actually been saved, and how the user can recover from an import error. Do not imply an account is needed to read or cook.

## Product Principles

- Keep the visible path short: one clear next action per screen, with advanced recipe data retained without crowding the first view.
- Give a useful, readable recipe before asking for an account.
- Keep one private library across entry points; the editor is the final review before Save.
- Make extraction limits visible and preserve the creator's source.
- Support a real cooking session with clear steps, controls and offline reading where available.
- Protect user control: confirmed writes, accessible export and no hidden transformation of recipes.

## Evidence on Hand

- [`docs/research/competitors.md`](docs/research/competitors.md) and [`docs/research/audience.md`](docs/research/audience.md): positioning and initial audience.
- [`docs/specs/extension.md`](docs/specs/extension.md) and [`docs/specs/web.md`](docs/specs/web.md): approved v1 behavior.
- [`docs/architecture.md`](docs/architecture.md), `src/lib/recipe-import-parser.ts`, `src/components/dashboard/recipe/CookingMode.tsx`, [`docs/pwa-v1.md`](docs/pwa-v1.md): implementation context.
- [`docs/research/parser-baseline.md`](docs/research/parser-baseline.md), [`docs/research/social-import.md`](docs/research/social-import.md), [`docs/specs/analytics-events.md`](docs/specs/analytics-events.md): import and measurement inputs for later work.

## Open Decisions

- Component and screen migration to the approved tokens in D-02…D-14; v1 functional flows are already approved.
- Technical extension handoff route and recovery behavior in E-02, while keeping the approved user flow.
- Export packaging in W-07, consent/legal copy and analytics implementation in W-08.
- Actual YouTube API/LLM quality, video source storage and platform policy review before X-01; price and Pro boundary later in P-01.
