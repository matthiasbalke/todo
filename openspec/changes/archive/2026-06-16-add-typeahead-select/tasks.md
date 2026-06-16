## 1. Shared Select Behavior

- [x] 1.1 Refactor `Select.svelte` so the selected-value area is an input-backed searchable control while preserving existing props, binding, disabled state, validation, and `onSelect` behavior.
- [x] 1.2 Add transient search-query state that filters options by `getOptionLabel(option)` and never emits arbitrary typed text as a selected value.
- [x] 1.3 Preserve and adapt keyboard behavior for the searchable control, including open-on-typing, ArrowUp/ArrowDown, Home/End, Enter selection, Escape dismissal, and focus restoration.
- [x] 1.4 Add a no-match empty state that prevents Enter from changing the selected value when no filtered option exists.
- [x] 1.5 Keep dropdown placement trigger-relative and visually consistent across default, compact, and dense select sizes.

## 2. Accessibility and Consumer Compatibility

- [x] 2.1 Update ARIA attributes to follow the combobox/listbox relationship with stable IDs, expanded state, controls relationship, and active descendant for focused options.
- [x] 2.2 Verify current consumers still receive original option values, including primitive string selects, category IDs with friendly labels, sort field objects, and timezone identifiers.
- [x] 2.3 Confirm disabled selects cannot open, filter, or emit changes and still display their selected labels.

## 3. Tests and Documentation

- [x] 3.1 Update `Select.test.ts` for the new combobox/input role and existing open, close, selection, validation, positioning, and accessibility behavior.
- [x] 3.2 Add tests for typing to filter, selecting a filtered option, abandoning a typed query, no-match behavior, and disabled search prevention.
- [x] 3.3 Update `TimezonePicker.test.ts` or focused consumer coverage if shared select behavior changes require query updates.
- [x] 3.4 Update the components showcase and its tests to demonstrate searchable select behavior.
- [x] 3.5 Refresh `docs/features/select-component.md` so it describes the current searchable shared select behavior.

## 4. Verification

- [x] 4.1 Run `cd frontend && bun run check`.
- [x] 4.2 Run `cd frontend && bun run test -- --run`.
- [x] 4.3 Run `openspec status --change "add-typeahead-select"` and confirm the change is apply-ready.
