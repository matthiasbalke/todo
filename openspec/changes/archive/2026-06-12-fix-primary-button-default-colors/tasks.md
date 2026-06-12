## 1. Restore Semantic Button Variants

- [x] 1.1 Update Sign in with Passkey to use the shared Button primary variant and remove competing semantic color utilities while preserving its full-width layout.
- [x] 1.2 Update Register passkey to use the shared Button primary variant and remove competing semantic color utilities while preserving its full-width layout.
- [x] 1.3 Update Delete my account to use the shared Button danger variant and remove competing semantic color utilities while preserving its existing geometry.

## 2. Add Regression Coverage

- [x] 2.1 Extend the authentication page tests to verify sign-in and registration actions include primary default, text, and hover classes and exclude the bare transparent background.
- [x] 2.2 Extend the account page tests to verify Delete my account includes danger default, text, and hover classes and excludes the bare transparent background.

## 3. Verify Frontend Behavior

- [x] 3.1 Run the focused authentication and account page test files.
- [x] 3.2 Run the frontend Svelte type check and resolve any regressions introduced by the variant updates.
