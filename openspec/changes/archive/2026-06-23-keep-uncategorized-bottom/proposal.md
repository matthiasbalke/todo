## Why

The uncategorized group is a fallback bucket for items without a category, not a category that users intentionally arrange. Keeping it anchored at the bottom makes category groups predictable and avoids mixing uncategorized items into the curated category order.

## What Changes

- Ensure the uncategorized group is always displayed after all real category groups when it is visible.
- Keep real categories ordered by their persisted `sortOrder`.
- Prevent group-sorting behavior from moving the uncategorized group away from the bottom.
- Preserve item drag-and-drop into and out of the uncategorized group.
- Treat this as a constraint on category group display order, not a new category-management object.

## Capabilities

### New Capabilities

### Modified Capabilities
- `list-ui-capabilities`: Adds an invariant that the virtual uncategorized category group is always displayed last.

## Impact

- Frontend grouping/order utilities and list page rendering: enforce uncategorized-last ordering consistently.
- Category group drag-and-drop behavior, if enabled: exclude the uncategorized group from sortable positions or snap it back to the bottom.
- Tests: utility/component coverage for uncategorized-last behavior with empty and populated categories.
- Active planning note: this supersedes the uncategorized-positioning portion of the active `sort-list-groups` change, which currently says uncategorized can participate in sorting.
