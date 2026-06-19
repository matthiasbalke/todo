## Context

GitHub issue #106 requests that select components expose an editable selected-value area so users can type to find predefined values. The frontend currently has a shared `Select.svelte` primitive that renders a button trigger and inline listbox. It is used by item forms, filters, sort controls, `TimezonePicker`, account settings, and the component showcase.

The current component already owns single-select state, option labeling through `getOptionLabel`, validation, disabled handling, pointer selection, keyboard navigation, unique IDs, and trigger-relative dropdown positioning. This change should build on that shared primitive so existing consumers inherit the behavior without adopting a new API.

## Goals / Non-Goals

**Goals:**

- Make the shared `Select` searchable by typing directly in the selected-value area.
- Keep `selected` and `onSelect` values restricted to the provided option objects or primitive values.
- Preserve existing pointer, keyboard, validation, disabled, binding, and positioning behavior.
- Support long option sets by filtering against `getOptionLabel(option)`.
- Cover the behavior with component tests and showcase examples.

**Non-Goals:**

- No free-form value creation.
- No multi-select support.
- No backend or persistence changes.
- No new dependency unless the existing Svelte/browser APIs prove insufficient.
- No consumer-specific forks for timezone, category, recurrence, sort, or filter fields.

## Decisions

1. Replace the visual trigger's value text with an input-backed combobox interaction inside `Select`.

   The selected-value area should be directly editable, so the component needs a real text input rather than hidden typeahead state attached to a button. The input should retain the current field styling and listbox relationship with `aria-expanded`, `aria-controls`, and `aria-activedescendant` while the popup is open.

   Alternative considered: keep the button and implement first-character navigation. That would improve keyboard access but would not satisfy the editable-area request.

2. Keep search query state separate from selected value.

   Typing filters the available options but does not mutate `selected`. `selected` only changes through explicit option selection by click, Enter, or Space on a focused option. On Escape, blur, or outside click without a selection, the visible input returns to the selected option label or placeholder.

   Alternative considered: auto-select the first matching option on blur. That can surprise users and would fire existing `onSelect` handlers during search abandonment.

3. Filter on the display label produced by `getOptionLabel`.

   Consumers can pass object IDs or identifiers while showing friendly labels. Filtering the label matches what users see while preserving the existing typed value contract.

   Alternative considered: stringify option values directly. That would make timezone and category labels less useful and could expose implementation IDs as search targets.

4. Reuse the existing listbox and selection contract.

   `filteredOptions` should drive the rendered options, focused index, empty-result state, and Enter selection. Selecting a filtered option still passes the original option value to `onSelect` and updates the bindable `selected`.

   Alternative considered: introduce a separate autocomplete component. That would duplicate single-select behavior and force current consumers to migrate.

5. Treat disabled selects as read-only display controls.

   Disabled selects should not accept focus, open, filter, or emit changes. Their selected label remains visible through the disabled field presentation.

## Risks / Trade-offs

- Accessibility role changes could regress screen reader behavior -> Use the ARIA combobox/listbox pattern consistently and add tests for core attributes.
- Filtering can leave no focused option -> Reset focus to the first filtered option when available and guard Enter selection when none exists.
- Query text can diverge from selected value -> Restore the selected label or placeholder whenever the user dismisses the popup without selecting.
- Existing tests query the control by button role -> Update tests to query the new combobox/input role while preserving accessible names.
- Very long option lists still render all filtered matches -> This change keeps scope narrow; virtualization is out of scope unless performance becomes a measured problem.
