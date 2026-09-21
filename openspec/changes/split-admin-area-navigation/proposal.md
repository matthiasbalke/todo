## Why

The admin page has grown from a small account-management surface into a mixed settings, email configuration, usage, and user-management page. Splitting it into admin subsections makes the workflows easier to scan, avoids loading unrelated data, and leaves room for future admin tools without turning `/admin` into a long catch-all page.

## What Changes

- Add a shared admin navigation shell with entries for Settings and Users.
- Make `/admin` route to the Settings subsection by default.
- Move registration, public app URL, and email configuration into `/admin/settings`.
- Move usage statistics and user account management into `/admin/users`.
- Use a persistent sidebar on wider screens and compact section navigation on small screens.
- Keep all existing admin authorization behavior and backend APIs unchanged.
- Keep the existing user-menu Admin link valid by allowing `/admin` to remain the entry point.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-area`: Admin frontend navigation is split into dedicated Settings and Users subsections with a shared admin shell.

## Impact

- Frontend routes: refactor `frontend/src/routes/(app)/admin` into a nested admin layout with settings and users pages.
- Frontend loading: settings and users pages load only the data they need instead of fetching settings, stats, and users together.
- Frontend tests: update admin load/page tests and add navigation coverage for redirect, sidebar/mobile section navigation, settings page, and users page.
- E2E tests: update admin/email tests that navigate to `/admin` if they depend on controls now living under `/admin/settings`.
- Backend APIs: no API changes expected.
