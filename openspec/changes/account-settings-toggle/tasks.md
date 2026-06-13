## 1. Shared Toggle Component

- [ ] 1.1 Implement shared `Toggle` with bindable checked state, disabled state, accessible naming, `role="switch"`, `aria-checked`, and checked-change callback
- [ ] 1.2 Add iOS-style track, thumb, checked, focus, transition, and disabled presentation owned by the component
- [ ] 1.3 Add Toggle component tests for on/off rendering, binding, pointer activation, Enter/Space activation, callbacks, accessible semantics, focus, and disabled behavior
- [ ] 1.4 Export Toggle through the shared component entry point and include it in shared component styling/inventory checks

## 2. Documentation And Showcase

- [ ] 2.1 Document the Toggle API, accessibility contract, intended settings usage, and examples in the shared component README
- [ ] 2.2 Add development showcase examples for off, on, disabled, binding, accessible labels, and callbacks
- [ ] 2.3 Add or update showcase tests for the Toggle examples and shared-component adoption

## 3. Account Settings Adoption

- [ ] 3.1 Rename the `/account` page heading from `Account` to `Settings` without changing the route or existing account features
- [ ] 3.2 Add muted supporting text directly below `TimezonePicker` explaining its Today and date-sensitive calendar behavior
- [ ] 3.3 Replace the enabled/disabled preference button with a `Today View` settings row using shared Toggle
- [ ] 3.4 Preserve the existing explicit save, disabled-while-saving, success, error, persisted-state, and Today-refresh behavior

## 4. Verification

- [ ] 4.1 Add account-page tests for the Settings heading, timezone explanation, Today View label, on/off state, disabled state, and save payload
- [ ] 4.2 Update end-to-end account/Today preference coverage to use the shared toggle interaction and verify persistence
- [ ] 4.3 Run frontend type checks, component/page tests, shared styling checks, and relevant end-to-end tests
- [ ] 4.4 Update project feature documentation and `MEMORY.md` with the shared Toggle and Settings presentation
