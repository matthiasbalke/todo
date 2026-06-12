## Context

`EditableLabel` currently has one commit policy: Enter and blur validate and save, while Escape cancels. Some fields require a more deliberate confirmation step. The account email editor demonstrates that pattern with an input and Save button contained in one focus group, including pointer handling so a blur caused by clicking Save does not dismiss the editor before the click runs.

The `/components` route now documents the existing component and provides a suitable place to demonstrate both policies.

## Goals / Non-Goals

**Goals:**

- Make `EditableLabel` discoverable and manually testable from `/components`.
- Add an explicit-save mode that commits only through its Save button.
- Preserve the existing automatic-save behavior as the default.
- Demonstrate both save modes and their interaction contracts using the real component.
- Match the organization and styling of the existing showcase sections.
- Keep examples deterministic and independent of backend services.

**Non-Goals:**

- Connect showcase examples to authentication or persistence APIs.
- Refactor the account page to use `EditableLabel`.
- Expose `/components` in production.
- Redesign or split up the full component showcase page.

## Decisions

### Represent commit behavior with a mode prop

`EditableLabel` will expose `saveMode: 'automatic' | 'explicit'` with a default of `'automatic'`. A string union makes the behavior clear at call sites and allows additional policies later without combining ambiguous booleans.

A boolean such as `showSaveButton` was considered, but it describes presentation rather than the commit contract and does not clearly communicate the changed Enter and blur behavior.

### Keep automatic mode unchanged

In automatic mode, Enter and blur will continue to validate and save, and Escape will cancel. Existing consumers that omit `saveMode` therefore retain their current behavior.

### Require a Save button click in explicit mode

Explicit mode will render the input and Save button inside one editor group. Clicking Save will validate, update the bound value, emit `change`, and exit edit mode. Enter will not save. Escape will cancel. Focus leaving the editor group will cancel the draft without dispatching `change`.

The component will use group-level focus handling and pointer-down protection based on the account email implementation so a Save button click is not mistaken for an outside blur in browsers where focus transition details are inconsistent.

### Reuse existing validation and event semantics

Both modes will use the existing validator and emit the existing `{ value: string }` `change` payload only after successful validation. `isSaving` will disable both the input and Save button, with the button text reflecting the saving state.

### Extend the existing showcase

The `/components` page will add an explicit-save example, mode-specific interaction guidance, and the new prop to its API table. Route-local state will expose the latest committed value without backend calls.

## Risks / Trade-offs

- [A Save click can trigger blur before click handling] → Treat input and button as one focus group and guard pointer-initiated focus-out, following the account email editor pattern.
- [Mode-specific keyboard behavior can surprise existing users] → Keep automatic mode as the default and document explicit mode's stricter contract.
- [A parent save can fail after the component emits `change`] → Keep persistence parent-controlled as today; `isSaving` covers in-flight UI, while API error and rollback policy remain consumer responsibilities.
- [Showcase documentation can drift from the component API] → Update component tests and showcase tests together with the prop addition.
