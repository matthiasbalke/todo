## 1. Showcase State and Examples

- [x] 1.1 Import `EditableLabel` into the `/components` showcase and add independent local state for the basic, validation, disabled, and saving examples.
- [x] 1.2 Add a representative validator and a `change` event handler that exposes the latest saved value without calling backend services.
- [x] 1.3 Render an `EditableLabel` showcase section with interactive basic and validation examples plus disabled and saving states.

## 2. Showcase Documentation

- [x] 2.1 Add usage code demonstrating representative props, validation, saving state, and `change` event handling.
- [x] 2.2 Document click, Space, Enter, Escape, and blur interactions in the showcase section.
- [x] 2.3 Add a complete props and events reference matching the current `EditableLabel.svelte` public API.

## 3. Verification

- [x] 3.1 Add focused route-level tests if the existing frontend test setup supports the showcase without substantial new harness code.
- [x] 3.2 Run the existing `EditableLabel` unit tests and relevant frontend type/lint checks, fixing any regressions introduced by the showcase changes.
- [x] 3.3 Verify the existing production redirect for `/components` remains unchanged.

## 4. Explicit Save Mode

- [x] 4.1 Add a typed `saveMode` prop to `EditableLabel` with `automatic` as the backward-compatible default.
- [x] 4.2 Render an explicit-mode editor group with the input and a Save button that reflects and respects `isSaving`.
- [x] 4.3 Implement explicit-mode interactions so only a Save button click commits, Enter does not save, Escape cancels, and outside blur discards the draft.
- [x] 4.4 Protect Save button pointer interactions from premature focus-out using the account email editor pattern.

## 5. Explicit Save Coverage and Documentation

- [x] 5.1 Add component tests for explicit Save commits, Enter no-op behavior, blur cancellation, Escape cancellation, validation failure, saving state, and focus-transition handling.
- [x] 5.2 Add an explicit-save example and emitted-value feedback to the `/components` showcase.
- [x] 5.3 Update showcase usage, keyboard guidance, and API reference for `saveMode` and mode-specific behavior.
- [x] 5.4 Extend route-level showcase tests to cover explicit-save behavior and documentation.

## 6. Final Verification

- [x] 6.1 Run the `EditableLabel` and component showcase test suites.
- [x] 6.2 Run frontend type checks and confirm existing automatic-mode tests remain unchanged in behavior.
- [x] 6.3 Validate the OpenSpec change and review the account email editor against the explicit-mode interaction contract.
