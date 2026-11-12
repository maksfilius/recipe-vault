# D-13 — extension cook mode

1. Add standalone reader helpers for measured step pagination, resize position remapping, duration detection and countdown formatting. Cover them with focused tests.
2. Update injected overlay and standalone fallback to use the same reader scripts and preserve recipe, ingredient and timer state for the open session.
3. Style the overlay with the web cook mode layout: compact header, visible timers, large step text, ingredient drawer, progress and pinned bottom navigation in both themes.
4. Capture exact 1440×900, 390×844 and 900×450 browser previews of the actual reader. Check long steps, timer deadlines, ingredient state, wake lock, keyboard and scroll boundaries where browser automation permits.
5. Run `npm run test`, `npm run build` and `git diff --check`; document any remaining physical Chrome/PWA checks.
