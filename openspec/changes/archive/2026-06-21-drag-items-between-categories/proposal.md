## Why

Users can organize list items by category, but dragging an item across category groups does not currently provide the expected way to recategorize it. Supporting cross-category drag and drop makes manual organization match how the list is visually grouped.

## What Changes

- Allow editable users to drag a list item from one category group into another category group in the standard list view.
- Update the item's category when it is dropped into a different category group, including the uncategorized group.
- Preserve manual ordering behavior within the destination category after the move.
- Keep viewer/read-only behavior unchanged: viewers can inspect category groupings but cannot move or recategorize items.

## Capabilities

### New Capabilities

### Modified Capabilities
- `list-ui-capabilities`: Adds cross-category item drag and drop as an item mutation available to users with item mutation capability.

## Impact

- Frontend list item drag-and-drop handling: support category changes when a dragged item crosses group boundaries.
- Frontend list store/API client: persist the updated category and sort order through existing item update/reorder flows where possible.
- Frontend list view permissions: ensure drag handles/drop targets remain gated by derived item mutation capability.
- Tests: frontend unit/component coverage for moving items between categories, moving to uncategorized, and viewer restrictions.
