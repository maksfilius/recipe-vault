# D-10 · Web cook mode

Source of truth: `docs/tasks.md` D-10, approved `docs/specs/web.md` and `docs/specs/extension.md`, `docs/pwa-v1.md`. User has repeatedly asked to continue the list, so implementation proceeds inline. The working tree already contains D-01…D-09; it cannot be moved to a clean worktree without losing that context. No commits are made in the shared dirty checkout.

## File map

- `src/lib/cooking-step-pages.ts`: pure text pagination against a supplied fit predicate.
- `tests/cooking-step-pages.test.mts`: long text, whitespace, oversized token, tiny available area.
- `src/components/dashboard/recipe/CookingMode.tsx`: measured pagination, step/part navigation, ingredient drawer, timer bar, keyboard and focus, wake lock lifecycle, responsive flat UI.
- `docs/design-cook-mode.md` and screenshots: behavior and viewport evidence.

## Tasks

1. **Pagination, RED → GREEN.** Test that all original words remain in order, each page fits the predicate, an oversized word still makes progress, and blank input returns no pages. Implement `paginateStepText(text, fits): string[]` with word boundaries and character fallback. Run focused and full tests.
2. **Step control.** Measure the available step area with a hidden same-style element and `ResizeObserver`. Keep `stepIndex` and `partIndex` separate. Previous traverses parts then steps; primary action says Continue step / Next step / Finish cooking. On resize, repaginate; show step and part progress. Verify a long step on 390×844 and a short step on desktop.
3. **Ingredients and focus.** Put ingredients in a drawer with native checkboxes, preserve checked items for the cooking session, close on Escape before exiting cook mode, trap Tab in the active dialog region, and restore focus to Start cooking on exit. Verify keyboard interaction in browser.
4. **Timers and wake lock.** Keep multiple manually started timers visible above the step, derive countdown from `endsAt`, refresh after visibility changes, prime sound on the start gesture, release/reacquire wake lock on visibility changes. Verify two timers and a simulated lock/unlock against a fake clock in browser.
5. **Finish.** Run `npm run test`, `npm run build`, `git diff --check`; inspect mobile/desktop light/dark and no horizontal scroll. Record concrete results in `docs/design-cook-mode.md`.

## Review focus

- No missing or duplicated words after pagination, including long unbroken text.
- Arrow keys must not fire while the ingredient drawer owns focus; Escape must close drawer first.
- Timer countdown must use a deadline after visibility changes, even if interval ticks were paused.
- Wake lock acquired after return must release if the dialog closes while its request is pending.
- Primary navigation remains above the mobile safe area at short viewport heights.

## Execution record

- Pagination tests: missing module/export failed first; 5 focused tests pass after implementation.
- Browser verification: 4 parts at 390×844, full text preserved, two deadline timers, drawer and keyboard focus, wake lock hide/show, 900×450 reflow.
- Final gate: `npm run test` 71/71, `npm run build` exit 0, `git diff --check` exit 0.
- Ruling: keep the shared dirty checkout and avoid commits/worktrees because D-01…D-09 are uncommitted in this workspace. Moving only D-10 would lose the current integration context.
- Ruling: a real OS lock/unlock of an installed PWA remains device QA; headless Chrome cannot establish that behavior.
