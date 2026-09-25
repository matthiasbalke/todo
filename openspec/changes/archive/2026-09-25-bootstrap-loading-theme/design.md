## Context

The current theme store defaults to `SYSTEM`, installs browser media-query handling on root layout mount, and applies the persisted account preference only after profile preferences load. `frontend/src/app.html` currently ships a static light `theme-color`, so the root loading state can paint before Svelte has applied the selected dark theme.

SvelteKit's `src/app.html` is the application HTML template and supports normal head content before `%sveltekit.body%`, so a small inline bootstrap can set document theme attributes before the rendered body becomes visible.

## Goals / Non-Goals

**Goals:**

- Apply the most recently known user theme preference before the startup/loading page renders.
- Preserve `/api/users/me` as the authoritative account preference after hydration.
- Keep the early document `data-theme`, `color-scheme`, and `theme-color` aligned with the later Svelte theme store behavior.
- Tolerate missing, invalid, or unavailable browser storage without breaking startup.

**Non-Goals:**

- Do not change backend preference storage or account preference APIs.
- Do not make local browser storage override the authenticated account profile.
- Do not add a separate unauthenticated theme picker.

## Decisions

### Store the startup hint in localStorage

Use a small, version-independent `localStorage` value containing the normalized account theme preference: `SYSTEM`, `LIGHT`, or `DARK`.

Rationale: the value is only needed by client-side startup code before hydration, and `localStorage` can be read synchronously from an inline bootstrap script. This avoids sending a cosmetic preference cookie on every request and avoids coupling server rendering to a value that is not authoritative.

Alternative considered: a non-HttpOnly cookie. That would also be synchronously readable and could be used by server hooks, but the current bug is visible in the client loading shell, not in server-only routing. A cookie would create extra request traffic and would still need client-side correction when the account profile loads.

### Keep the profile authoritative

When preferences load or update successfully, normalize the returned `themePreference`, apply it through the existing theme store, and write the same normalized value to the startup cache. If the cached value differs from the profile, the profile wins immediately.

Rationale: the user preference is account-scoped and should remain consistent across devices. The cache is intentionally a stale-tolerant boot hint for the same browser.

The cache should be written only from confirmed backend preference state: after `/api/users/me` returns the profile during startup, and after a preference update request succeeds and returns the updated profile. The frontend should not treat an unsaved local selection or failed update attempt as cache-worthy account truth.

### Bootstrap before body rendering

Add a small inline script in `frontend/src/app.html` before `%sveltekit.head%` or before `%sveltekit.body%` that:

- Reads the cached preference inside a `try/catch`.
- Resolves `SYSTEM` with `matchMedia('(prefers-color-scheme: dark)')`.
- Applies `document.documentElement.dataset.theme`.
- Applies `document.documentElement.style.colorScheme`.
- Updates or creates the `meta[name="theme-color"]` value.

The script should share constants and semantics with `theme.svelte.ts` as closely as practical, while remaining self-contained enough to run before bundled modules load.

### Make the theme store cache-aware

The Svelte theme store should initialize from the same cache when running in the browser, and writes to `setThemePreference` should update the cache. Tests should cover storage errors, invalid cache values, explicit dark preference, and `SYSTEM` resolution.

Rationale: keeping the store and bootstrap aligned reduces flicker after hydration and keeps a single observable preference lifecycle.

## Risks / Trade-offs

- Stale cached preference after changing theme on another device -> The next profile load replaces it and updates the cache.
- `localStorage` unavailable or throwing -> Bootstrap and store fall back to system theme without blocking startup.
- Inline script duplicates small theme-resolution logic -> Keep the logic minimal and cover it with root startup tests or app template-focused tests.
- Strict CSP could require a nonce for inline scripts -> If CSP is enforced for this app in the future, use SvelteKit's `%sveltekit.nonce%` placeholder on the bootstrap script.

## Migration Plan

No backend migration is required. Existing browsers without the new cache fall back to system theme until the account profile loads, then populate the cache for subsequent launches.
