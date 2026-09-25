## Why

GitHub issue #279 reports that the startup loading screen always appears in the light theme even when the user has selected dark theme. The app already persists the account theme on the backend, but the loading shell can render before that profile is available, causing a visible mismatch during startup.

## What Changes

- Persist the latest normalized theme preference in browser-accessible storage whenever the frontend learns or updates the account preference.
- Add an early startup theme bootstrap that runs before the SvelteKit body renders and applies the cached preference, falling back to the browser system color scheme when no valid cache exists.
- Keep the backend profile preference authoritative after hydration; the browser cache is only an early render hint and is corrected after profile loading.
- Keep browser and PWA theme metadata aligned with the early effective theme so the loading screen and browser chrome match.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `user-theme-preference`: Change startup behavior so the frontend may use a local cached theme preference before the persisted account preference is available.

## Impact

- Frontend theme store and preference loading/update flows.
- SvelteKit `app.html` startup template for the pre-hydration theme bootstrap.
- Frontend tests covering cached preference startup, invalid cache fallback, and profile-authoritative correction.
