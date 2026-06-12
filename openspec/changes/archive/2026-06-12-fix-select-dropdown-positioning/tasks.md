## 1. Reproduce And Specify The Positioning Boundary

- [x] 1.1 Add a Select regression fixture or test that renders the control inside a transformed ancestor and proves the open listbox is associated with a trigger-local positioning wrapper.
- [x] 1.2 Add MembersDialog test setup for an owner with another member so both the existing-member and invitation role Select controls are available.

## 2. Shared Select Positioning

- [x] 2.1 Wrap the Select trigger and conditional listbox in a trigger-scoped relative positioning container without including the label or validation message.
- [x] 2.2 Replace fixed viewport positioning and inline coordinates with component-owned absolute placement directly below the trigger at full trigger width.
- [x] 2.3 Remove obsolete dropdown coordinate state and measurement while retaining the trigger element reference needed for Escape focus restoration.
- [x] 2.4 Preserve unique IDs, `aria-controls`, listbox roles, selected/active option semantics, and semantic Button composition.

## 3. Interaction And Consumer Regression Coverage

- [x] 3.1 Extend Select tests for transformed-ancestor placement, normal placement, width ownership, multiple instances, option selection, outside-click dismissal, and Escape focus restoration.
- [x] 3.2 Add MembersDialog tests proving the existing-member role options and invitation role options open at their corresponding Select triggers.
- [x] 3.3 Verify member role changes and invitation role selection continue to call the existing handlers with the selected `ListRole`.
- [x] 3.4 Run ItemForm Select regressions to confirm listbox interaction remains internal and does not trigger form cancellation.

## 4. Documentation And Verification

- [x] 4.1 Update shared-component documentation with Select's trigger-relative listbox positioning contract and current collision-handling boundary.
- [x] 4.2 Run focused Select, MembersDialog, ItemForm, and semantic styling guard tests.
- [x] 4.3 Run the complete frontend Vitest suite, Svelte type check, and production build.
- [x] 4.4 Validate the `fix-select-dropdown-positioning` OpenSpec change.
