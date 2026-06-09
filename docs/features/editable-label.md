# Feature: Editable Label Component

## Overview

The `EditableLabel` component provides an inline editing experience for short text fields (like display name or email). It displays as read-only text by default and transforms into an input when activated. Automatic mode saves with Enter or blur; explicit mode requires the Save button. Escape cancels in both modes.

## Design Decisions

- **Based on TextInput** — reuses styling, validation, and error handling from the existing TextInput component
- **Inline edit pattern** — reduces cognitive load for account management; no modal dialogs or separate edit screens
- **Save modes** — automatic mode preserves Enter/blur saving, while explicit mode provides a visible Save action for deliberate confirmation
- **Validation** — delegates to an optional validator function passed as a prop; shows errors inline
- **Loading state** — accepts an optional `isSaving` prop to disable input during API calls
- **Events** — emits `change` event on successful save; parent can handle API calls and error states
- **No built-in API** — component is dumb; parent owns validation, API calls, and persistence

## Security Considerations

- Input is sanitized by Svelte's default XSS prevention
- Validators are optional and user-provided; no risky HTML escaping
- No automatic API calls; all mutations are parent-controlled
- Disabled state prevents editing during save operations

## Implementation Plan

1. Create `frontend/src/lib/components/EditableLabel.svelte` with:
   - Props: `value`, `label`, `placeholder`, `type`, `disabled`, `isSaving`, `validate`
   - State: `isEditing`, `editValue`, `errorMessage`
   - Methods: `startEdit()`, `saveEdit()`, `cancelEdit()`, `handleKeydown()`
   - Events: `change` event with `{ value: string }`

2. Create `frontend/src/lib/components/EditableLabel.test.ts` with:
   - Renders as label by default
   - Clicking label enters edit mode
   - Clicking input shows editable field
   - Enter saves and emits change event
   - Escape cancels edit
   - Blur saves (if no errors)
   - Validation shows errors
   - isSaving prop disables input

3. Update `frontend/src/lib/components/README.md` to document the new component

4. Update `docs/tasks.md` to reflect completion
