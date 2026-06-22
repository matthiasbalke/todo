## Why

List group wrapper sorting is already represented in the main `list-ui-capabilities` spec, but this active change was still empty and did not account for the newer uncategorized-last category group invariant. Updating the change keeps planning state aligned and prevents list group sorting work from being confused with category group ordering.

## What Changes

- Clarify that sorting list groups on `/lists` only reorders persisted list group wrappers.
- Preserve the virtual `Ungrouped` list section at the bottom of `/lists`.
- Preserve category grouping invariants inside individual lists, including the uncategorized category group remaining after all real category groups.
- Avoid adding any sortable state for uncategorized category groups or list-category ordering as part of list group sorting.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `list-ui-capabilities`: Clarifies that list group sorting does not affect per-list category group ordering or the uncategorized-last invariant.

## Impact

- OpenSpec planning artifacts for the active `sort-list-groups` change.
- Existing frontend list overview behavior and tests remain the implementation reference.
- No backend API, data model, or deployment changes.
