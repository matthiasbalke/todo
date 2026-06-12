## Why

The frontend component library has reusable controls for single-line text, selections, dates, and buttons, but multiline text still uses raw `<textarea>` elements with duplicated styling and no shared validation or accessibility contract. Adding a base Textarea component fills that gap and gives forms a consistent primitive for notes and longer text.

## What Changes

- Add a reusable `Textarea.svelte` component to the frontend component library.
- Support bindable text values, visible or screen-reader labeling, placeholder text, required and disabled states, row sizing, resize configuration, validation, and standard textarea attributes and event handlers.
- Provide accessible label, description, and validation-error associations with unique identifiers per component instance.
- Add colocated unit tests covering rendering, binding, validation, accessibility, attribute forwarding, events, and multiple instances.
- Document the component API and usage in the component library README.
- Add interactive examples, usage snippets, and an API reference to the development-only component showcase.
- Replace the raw notes textarea in `ItemForm` with the shared component while preserving form submission and focus/cancel behavior.

## Capabilities

### New Capabilities

- `textarea-component`: Reusable multiline text entry with consistent styling, binding, validation, accessibility, native attribute forwarding, and component-library documentation.
- `textarea-showcase`: Interactive development examples and API documentation for the Textarea component.

### Modified Capabilities

None.

## Impact

- Adds `frontend/src/lib/components/Textarea.svelte` and its colocated test suite.
- Updates `frontend/src/lib/components/README.md` with the new component contract and examples.
- Updates the development-only `/components` showcase and its tests.
- Updates `frontend/src/lib/components/ItemForm.svelte` and relevant tests to adopt the component.
- Introduces no new runtime dependency and does not change backend APIs, persistence, or data models.
