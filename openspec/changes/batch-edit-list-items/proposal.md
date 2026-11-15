# Proposal

## Why

[Issue #197](https://github.com/matthiasbalke/todo/issues/197) asks users to manage several items in the same list together. Editing assignees, due dates, categories, or recurrence one item at a time is repetitive and makes consistent updates difficult.

## What Changes

- Add explicit multi-item selection to the standard list view for owners and editors, with a selected count, select-visible, clear, and cancel actions.
- Add a batch editor with independent unchanged, set, and clear choices for due date, category, and recurrence, plus adding, removing, replacing, or clearing assignees.
- Preserve explicit selections when filters or collapsed sections hide items; show selected and hidden counts. Change only selected occurrences, including completed recurring occurrences.
- Track batches with client-generated IDs and an authorized status lookup, with duplicate submission protection.
- Add item versions across APIs, SSE, and client state to reject stale data and prevent deleted items from reappearing.
- Apply changes atomically through a list-scoped batch API; preserve unspecified properties and notify connected clients after commit.
- Cover validation, permissions, filtering, touch/keyboard operation, failures, and recurrence preservation.

## Capabilities

### New Capabilities

- `batch-item-editing`: Selection, batch editing of supported properties, atomic authorization/validation, and synchronized list state.

### Modified Capabilities

None. Existing role mapping, recurrence rules, and ordinary list interactions remain the basis for the new workflow.

## Impact

- Backend item controller/service/repositories, category and membership validation, and transaction-aware SSE publication.
- Frontend item API/store, standard list route, CategoryGroup/ItemCard selection controls, and a dedicated batch editor reusing CategorySelect, DatePicker, MultiSelect, and RecurrenceEditor.
- Backend integration tests, frontend component/store tests, and focused Playwright coverage. Schema migrations are required for item versions and durable batch outcome tracking; no new runtime dependency is expected.
- Initial scope is the standard real-list view; Today and grocery mode retain their current behavior.
