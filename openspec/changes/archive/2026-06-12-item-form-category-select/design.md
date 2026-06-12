## Context

`ItemForm` currently stores category selection as a string category ID, with an empty string representing no category until submission converts it to `null`. Its native select includes an `Uncategorized` option and category options whose values are IDs and whose visible text is category names.

The shared `Select` accepts generic option values, but currently renders each option value directly. Passing category names would make the control look correct but would make selection ambiguous when names are duplicated and would require mapping names back to IDs. Passing IDs preserves the data contract but exposes implementation identifiers to users.

The form also cancels new-item creation when focus leaves the form, so dropdown interactions must remain internal and must not trigger cancellation.

## Goals / Non-Goals

**Goals:**
- Replace only the category native select in `ItemForm` with the shared Select.
- Preserve category IDs as option values and category names as visible labels.
- Preserve `Uncategorized`, existing item values, `defaultCategoryId`, nullable submission, and new-item reset behavior.
- Preserve keyboard-accessible selection and the new-item form's focus-loss cancellation behavior.
- Add focused component and integration coverage.

**Non-Goals:**
- Replace the recurrence native select or other native selects.
- Change category ordering, category creation, or category persistence.
- Change the `TodoItem` category data contract.
- Add multi-select behavior or category searching.
- Redesign the shared Select beyond the display-label support required by this integration.

## Decisions

### Add a typed option-label resolver to Select

`Select` will accept an optional `getOptionLabel: (option: T) => string` prop and use it for both the trigger text and listbox option text. When omitted, existing primitive options will retain their current string rendering behavior.

This keeps option identity and display text separate while preserving the existing API. Using category names as option values was rejected because names are not stable identifiers and duplicate names would be ambiguous. Passing category objects was rejected because selection currently relies on `options.indexOf`, making object identity unnecessarily significant across reactive updates.

### Use category IDs, including the empty uncategorized sentinel, as options

`ItemForm` will provide the Select with an ordered option list containing the empty string followed by each category ID. Its label resolver will map the empty string to `Uncategorized` and each ID to the matching category name.

The component's `selected` value will receive the current `categoryId`, and `onSelect` will assign the selected ID back to form state. Keeping the existing empty-string sentinel avoids changing initialization, submission conversion, and reset semantics.

### Keep dropdown interactions inside the form contract

The shared Select trigger and dropdown are rendered from the component at the category field's position inside the form. Pointer and keyboard interaction with the trigger and options will therefore be treated as internal form interaction. Focused `ItemForm` tests will prove opening, keyboard navigation, selection, and dismissal do not invoke `oncancel`, while an actual focus move outside the form still does.

The category-specific native `onblur` workaround will be removed with the native select. The recurrence select will retain its existing workaround.

### Cover shared behavior and form integration separately

`Select` tests will verify custom labels in the closed trigger and open listbox while callbacks continue returning original option values. `ItemForm` tests will verify category-specific initialization, defaults, uncategorized selection, submission, reset, keyboard use, and cancellation behavior.

## Risks / Trade-offs

- [A label resolver cannot find a category for a stale ID] → Fall back to the ID so the current value remains visible and selectable rather than silently appearing empty.
- [The empty string is a selected option rather than the Select placeholder state] → Treat it intentionally as the labeled `Uncategorized` option; reserve `null` for the component's no-selection placeholder behavior.
- [Adding label resolution could regress existing Select rendering] → Make the prop optional, preserve the current default conversion, and add regression tests for primitive options.
- [Dropdown focus or pointer events could close a new-item form] → Add integration tests for mouse and keyboard workflows and retain the form's existing internal-pointer guard.
