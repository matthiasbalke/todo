## 1. Theme Startup Cache

- [x] 1.1 Add a browser-storage helper for the normalized theme preference and verify unit tests cover valid values, invalid values, missing storage, and storage exceptions.
- [x] 1.2 Update the theme store to initialize from the cached preference in the browser and to write successful preference changes back to the cache; verify `theme.svelte` tests cover cached `DARK`, cached `SYSTEM`, and profile correction.
- [x] 1.3 Update preference load/update flows so profile responses refresh the cache with the authoritative normalized preference; verify `preferences.svelte` tests assert cache refresh after load and update.

## 2. Pre-Hydration Bootstrap

- [x] 2.1 Add an inline startup script to `frontend/src/app.html` that applies the cached effective theme, document `color-scheme`, and `theme-color` before `%sveltekit.body%` renders; verify an app template or root startup test observes dark attributes before layout mount.
- [x] 2.2 Ensure the bootstrap falls back to browser system color scheme when the cache is absent, invalid, or unreadable; verify tests cover invalid cache and throwing `localStorage`.

## 3. Validation

- [x] 3.1 Run `cd frontend && bun run check` and verify Svelte type-checking passes.
- [x] 3.2 Run targeted frontend tests for theme, preferences, and root layout startup and verify they pass.
- [x] 3.3 Manually verify the root loading/startup screen opens in dark theme after a previous dark preference has been cached.
- [x] 3.4 Add E2E coverage for the cached dark startup loading screen and verify the focused Playwright test passes.
