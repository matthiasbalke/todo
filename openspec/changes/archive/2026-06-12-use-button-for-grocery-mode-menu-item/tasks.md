## 1. Grocery Mode Menu Action

- [x] 1.1 Replace the standard list menu's "Grocery mode" anchor with a bare shared Button using start alignment and regular weight.
- [x] 1.2 Preserve menu dismissal and navigate to `/lists/{id}/grocery` through the existing SvelteKit `goto` dependency.
- [x] 1.3 Preserve the current full-width spacing, text color, size, and hover background so the row matches adjacent menu buttons.

## 2. Regression Coverage

- [x] 2.1 Update the standard list menu test to assert that "Grocery mode" has button rather than link semantics and uses the expected shared Button presentation.
- [x] 2.2 Verify activation calls `goto` with the current list's grocery route and closes the menu.
- [x] 2.3 Run the focused standard list route test, full frontend test suite, `svelte-check`, and production frontend build.
