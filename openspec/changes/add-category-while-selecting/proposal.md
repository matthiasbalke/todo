# Proposal

## Why

Assigning an item to a new category currently requires leaving the category picker and using category management. GitHub issue [#307](https://github.com/matthiasbalke/todo/issues/307) requests creating and selecting a category directly from the typed search.

## What Changes

- Show `+ Create <typed name>` inside the category picker when category creation is permitted and the trimmed name is nonempty and has no exact case-insensitive match.
- Support Enter, mouse, and touch activation; create the category in the current list and select its persisted ID after success.
- Integrate the behavior with quick-add and existing-item category assignment, preserving drafts and existing autosave behavior.
- Prevent duplicate submissions while creation is pending and preserve the prior assignment on failure with a visible retryable error.
- Document and demonstrate the optional creation behavior in the component showcase.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `category-select-component`: Optional category creation action, accessible activation, pending and error handling, and showcase coverage.
- `item-form-category-selection`: Permission-aware category creation in quick-add and item editing with persisted selection and draft preservation.

## Impact

Frontend shared Select/Combobox integration, CategorySelect, ItemForm, QuickAddItemForm, list capability wiring, category store, component documentation/showcase, and focused unit and end-to-end tests. Reuse the existing category POST endpoint, server authorization, and SSE category events; no database migration or new dependency is planned.
