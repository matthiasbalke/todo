# Select Component

## Overview

`Select.svelte` is the shared single-select control for choosing one predefined value from a list of options. It renders an input-backed combobox for the selected-value area, so users can click or focus the field and type to find matching options.

Typing is only a search query. The selected value remains one of the provided options and changes only when the user chooses an option with pointer or keyboard.

## Design Decisions

### Single Select Only

The component supports one selected value at a time. Multi-select and free-form option creation are separate future capabilities.

### Searchable Predefined Options

The selected-value area is editable while the user searches. The query filters the predefined option list by the display label returned from `getOptionLabel(option)`. If the user dismisses the list without selecting an option, the field returns to the selected option label or placeholder.

### Typed Values With Friendly Labels

Consumers may pass primitive values, IDs, or objects. `getOptionLabel` controls what the user sees and what the search query matches, while `selected` and `onSelect` continue to use the original option value.

### Keyboard Navigation

The component supports Enter or ArrowDown to open, ArrowUp/ArrowDown to move between options, Home/End to jump to the first or last filtered option, Enter to select the focused option, and Escape or outside click to dismiss without changing the value.

### Trigger-Local Positioning

The listbox is rendered inline in a trigger-local relative wrapper and positioned absolutely below the combobox at the same width. This keeps transformed containers such as dialogs aligned without viewport coordinate calculations.

### Accessibility

- Input uses `role="combobox"` with `aria-autocomplete="list"`.
- Open state uses `aria-expanded`, `aria-controls`, and `aria-activedescendant`.
- The option container uses `role="listbox"`.
- Options use `role="option"` and `aria-selected`.
- Visible labels are associated with the combobox; unlabeled instances use the placeholder as their accessible name.
- Validation errors use `aria-invalid` and `aria-describedby`.

## Security Considerations

- Option labels are rendered as Svelte text content, not injected HTML.
- Typed search text is transient and cannot become a persisted or submitted selected value.
- Selection callbacks receive only values from the provided `options` array.

## Implementation Notes

- Props include `options`, bindable `selected`, `disabled`, `label`, `placeholder`, `labelId`, `id`, `listboxId`, `class`, `size`, `getOptionLabel`, `validate`, and `onSelect`.
- Disabled selects display their current label but do not open, filter, or emit changes.
- The empty option list shows `No options available`; a search with no matches shows `No matching options`.
