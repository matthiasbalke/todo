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
