## 1. Shared Viewport Behavior

- [ ] 1.1 Add a reusable mobile viewport-positioning helper or Svelte action for owner elements and verify unit coverage exercises `visualViewport` offset handling, document-scroller fallback, mobile gating, and disabled/opt-out behavior.
- [ ] 1.2 Add nested option-surface ignore support to the helper and verify tests show listbox/calendar option interactions do not trigger page-level repositioning.

## 2. Shared Component Adoption

- [ ] 2.1 Adopt the helper in shared text-entry controls (`TextInput`, `EmailInput`, and `Textarea`) and verify their component tests still pass with added focus/touch scroll assertions.
- [ ] 2.2 Adopt the helper in shared selection controls at the lowest reusable layer (`Select`, `ComboboxPrimitive`, `MultiSelect`, and composed category/timezone selectors where inherited) and verify selection, filtering, keyboard navigation, and nested listbox scrolling tests pass.
- [ ] 2.3 Adopt the helper in shared custom editors (`DatePicker`, `EditableLabel`, and any directly affected composed editor surface) and verify focus return, keyboard navigation, and save/cancel tests pass.

## 3. Consumer Migration

- [ ] 3.1 Replace duplicated local viewport-scroll logic in `ItemForm` with the shared helper where equivalent and verify item form tests cover mobile positioning, autosave, focus-out cancellation, dialog focus return, and draft preservation.
- [ ] 3.2 Replace or align similar local logic in `ListGroupSection` rename behavior when practical and verify rename tests cover focus and scrolling behavior.

## 4. Verification

- [ ] 4.1 Run targeted frontend component tests for the helper and adopted controls with `cd frontend && bun run test -- --run <affected-tests>` and verify they pass.
- [ ] 4.2 Run `cd frontend && bun run check` and verify Svelte/type checking passes.
- [ ] 4.3 Run `openspec validate components-scroll-to-top --strict` and verify the change artifacts are valid.
