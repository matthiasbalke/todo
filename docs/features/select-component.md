# Select Component

## Overview

A reusable single-select dropdown component for SvelteKit that provides a consistent UI primitive for selecting one value from a list of options. The component displays a trigger button that opens a dropdown menu on click, supporting custom option rendering via Svelte slots. Options can be disabled individually, and the component provides full keyboard navigation support (arrow keys, Enter, Escape).

## Design Decisions

### Single Select Only
The component implements single-select semantics (one selected value at a time), distinct from multi-select. This keeps the API simple and focused. Multi-select can be a future component if needed.

### Slot-Based Custom Rendering
Rather than requiring option objects with specific shapes, the component exposes slots for:
- `trigger` — the button that opens the dropdown (displays selected value)
- `option` — each option in the list (rendered with `let:option` context)

This allows consumers to render options with icons, colors, or any custom markup without the component needing to know about their structure.

### Keyboard Navigation
Full arrow key navigation (up/down), Enter to select, Escape to close, and Home/End to jump to first/last option. Screen reader users can also use the standard dropdown ARIA patterns.

### Portal Rendering
The dropdown menu is rendered in the DOM root (via `<Portal>`) rather than inline, avoiding z-index stacking issues and ensuring the menu can overflow document boundaries without clipping.

### Accessibility
- ARIA `combobox` role (semantic dropdown pattern)
- `aria-expanded`, `aria-haspopup`, `aria-controls` for open/closed state
- `aria-selected` on options
- Label support via `labelId` prop for association
- Invalid state indication via `aria-invalid`

## Security Considerations

- **XSS Prevention:** All option content is rendered via Svelte slots; no HTML strings are directly inserted. The selected value is derived from the options list, preventing injection of arbitrary values.
- **No User Input:** The component is read-only (no text field to type in), so there's no risk of unvalidated input being submitted.
- **DOM Structure:** The dropdown is appended to the document root via portal, so the component cannot be accidentally nested in a form that would interfere with event propagation.

## Implementation Plan

1. **Create `Select.svelte` component** with:
   - Props: `options` (array), `selected` (value), `disabled`, `label`, `placeholder`, `labelId`, `validate`
   - Slots: `trigger`, `option`
   - Keyboard navigation and click handling
   - Portal for dropdown rendering

2. **Create `SelectOption.svelte` helper component** for:
   - Wrapping individual option elements
   - Handling hover state, selection, and disabled state
   - Exposing option context to consumers

3. **Create unit tests** covering:
   - Rendering and initial state
   - Opening/closing dropdown
   - Keyboard navigation (arrow keys, Home, End, Enter, Escape)
   - Option selection and value binding
   - Disabled state (both component and individual options)
   - Accessibility attributes (aria-expanded, aria-selected, etc.)
   - Slot rendering (trigger and option)

4. **Type safety** with TypeScript generics:
   - `Select<T>` generic to allow any option type
   - Proper type inference for `selected` and option iteration

5. **Styling with TailwindCSS**:
   - Dropdown positioned absolutely below the trigger
   - Dark overlay when open (optional; configurable)
   - Hover/focus states on options
   - Smooth animations for open/close

6. **Integration with existing components**:
   - Ensure consistent look and feel with `TextInput.svelte`
   - Use same color scheme and spacing as other form components
