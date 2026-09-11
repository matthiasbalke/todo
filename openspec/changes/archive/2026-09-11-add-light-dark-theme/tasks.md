## 1. Backend Preference Contract

- [x] 1.1 Add a persisted user theme preference with default `SYSTEM` for new and existing users, and verify the database migration smoke test passes.
- [x] 1.2 Extend authenticated user profile responses and preference update requests with `themePreference`, and verify backend user preference integration tests cover load and update behavior.
- [x] 1.3 Reject unsupported theme preference values without changing persisted preferences, and verify a backend integration test covers the validation failure.

## 2. Frontend Preference State

- [x] 2.1 Extend frontend user profile and preference API types to include `themePreference`, and verify API unit tests cover request and response shapes.
- [x] 2.2 Update the preferences store to load, save, and expose `themePreference` while preserving timezone initialization behavior, and verify store tests cover default/fallback and save behavior.
- [x] 2.3 Add effective theme calculation for `SYSTEM`, `LIGHT`, and `DARK`, including live system color-scheme changes, and verify unit tests cover each resolution path.

## 3. Theme Application And Styling

- [x] 3.1 Apply the effective theme to the root document before authenticated content is interactive, and verify layout/startup tests assert the applied root theme attribute.
- [x] 3.2 Define production light and dark semantic color tokens for app backgrounds, surfaces, text, borders, focus, success, danger, selected state, and form controls, and verify component/foundation tests cover both themes.
- [x] 3.3 Update shared controls and representative app surfaces to consume semantic theme tokens instead of hard-coded one-theme colors, and verify frontend type-check and styling guard tests pass.
- [x] 3.4 Keep diagnostic palette behavior distinct from production light and dark themes, and verify existing diagnostic palette Playwright coverage still detects token changes.
- [x] 3.5 Update runtime browser/PWA theme-color metadata when the effective theme changes, and verify a frontend unit test or Playwright assertion checks the metadata for light and dark themes.
- [x] 3.6 Add a local theme selector to the development component showcase with `System`, `Light`, `Dark`, and `Diagnostic` options, remove the root-layout floating diagnostic control, and verify component page tests cover the available modes and applied root theme or diagnostic attributes.

## 4. Account Settings UI

- [x] 4.1 Add an accessible `Theme` control with `System`, `Light`, and `Dark` options to the Account `Settings` section, and verify account page tests assert labels, options, and selected persisted value.
- [x] 4.2 Submit timezone, Today View, and theme together through the immediate-save preference flow, and verify account page tests cover successful theme save, disabled controls during save, and rollback on failure.
- [x] 4.3 Apply a newly saved theme without requiring a reload, and verify account page tests or Playwright coverage checks visible theme change after selection.

## 5. End-To-End Verification

- [x] 5.1 Add Playwright coverage for selecting light and dark themes, reloading, and seeing the persisted selection and active theme, and verify the new spec passes.
- [x] 5.2 Add Playwright coverage for `System` following mocked light and dark color schemes where feasible, and verify the effective theme changes without a saved explicit light/dark preference.
- [x] 5.3 Run `cd backend && ./gradlew test` and verify the backend suite passes.
- [x] 5.4 Run `cd frontend && bun run check && bun run test -- --run` and verify the frontend suite passes.
- [x] 5.5 Run the agent e2e workflow against the configured HTTPS deployment and verify Playwright passes.
- [x] 5.6 Add Playwright coverage for the `/components` theme selector and verify `System`, `Light`, `Dark`, and `Diagnostic` modes affect the showcase locally.
