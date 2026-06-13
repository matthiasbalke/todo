## 1. Shared Toggle Component

- [x] 1.1 Implement shared `Toggle` with bindable `checked`, `disabled`, `ariaLabel`, `onchange`, `id`, layout-only `class`, bindable `element`, forwarded native button attributes, `role="switch"`, and `aria-checked`
- [x] 1.2 Add iOS-style track, thumb, checked, focus, transition, and disabled presentation owned by the component
- [x] 1.3 Add Toggle component tests for on/off rendering, binding, pointer activation, Enter/Space activation, callbacks, accessible semantics, focus, and disabled behavior
- [x] 1.4 Register Toggle in shared component styling and native-control inventory checks

## 2. Documentation And Showcase

- [x] 2.1 Document the Toggle API, accessibility contract, intended settings usage, and examples in the shared component README
- [x] 2.2 Add development showcase examples for off, on, disabled, binding, accessible labels, and callbacks
- [x] 2.3 Add or update showcase tests for the Toggle examples and shared-component adoption

## 3. Account Settings Adoption

- [x] 3.1 Keep the `/account` page heading and navigation label as `Account`, and rename the preference section from `Today` to `Settings`
- [x] 3.2 Add muted supporting text directly below `TimezonePicker` explaining its Today and date-sensitive calendar behavior
- [x] 3.3 Replace the enabled/disabled preference button with a `Today View` settings row using shared Toggle
- [x] 3.4 Remove the explicit save button and auto-save both current preference values when timezone or Today View changes
- [x] 3.5 Disable both settings controls during save, clear prior feedback on modification, show success after save, restore persisted values after failure, and retain Today refresh behavior

## 4. Verification

- [x] 4.1 Add account-page tests for the Account page heading, Settings section heading, timezone explanation, Today View label, on/off state, immediate save payloads, disabled state, feedback clearing, success, and failure rollback
- [x] 4.2 Update end-to-end account/Today preference coverage to use the shared toggle interaction and verify persistence
- [ ] 4.3 Run frontend type checks, component/page tests, shared styling checks, and relevant end-to-end tests
- [x] 4.4 Update project feature documentation and `MEMORY.md` with the shared Toggle and Settings presentation

## 5. Small Interaction Fixes

- [x] 5.1 Change StarToggle focus styling so pointer activation does not display a border or ring while keyboard focus remains visibly indicated
- [x] 5.2 Add or update StarToggle tests for pointer activation presentation and keyboard-visible focus
- [x] 5.3 Replace broad `/Today/` locators in `e2e/tests/today.spec.ts` with exact, route-aware locators that distinguish the virtual Today link from lists such as `Today Source`
- [ ] 5.4 Run the affected StarToggle tests and the `Today preferences, count, completion, and source navigation` Playwright test
