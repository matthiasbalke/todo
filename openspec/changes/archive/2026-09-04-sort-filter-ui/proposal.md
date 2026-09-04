## Why

When a list is filtered, the only visible reminder is inside the options menu, so users can mistake a filtered list for a complete list. GH issue 98 asks for an always-visible indication of active filters and sort order without crowding the list view.

## What Changes

- Show a compact summary above list items on standard list, grocery list, and Today views with item count, active sort order, and active filter chips.
- Represent each active filter as a dismissible chip so the user can reset one filter without opening the list menu.
- Include the current sort order in the same summary area as an interactive control that lets the user change both sort criteria and ascending/descending order directly from the summary.
- Move Hide checked into the filter submenu and treat it as a normal filter in labels, active counts, and summary chips.
- Fix Today item ordering so Today uses its own sort preference consistently, including initial render, without falling back to each source list's individual item sorting.
- Keep the existing options menu controls and local preference persistence behavior.
- Keep filtering client-side and do not change backend list or item APIs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `list-ui-capabilities`: List views expose active filter and sort state near the rendered items and allow clearing individual active filters.
- `today-view`: Today exposes active filter and sort state near rendered items, treats Hide checked as a normal filter, and applies Today-specific sorting consistently.

## Impact

- Frontend list views: `frontend/src/routes/(app)/lists/[id]/+page.svelte`, `frontend/src/routes/(app)/lists/[id]/grocery/+page.svelte`, and `frontend/src/routes/(app)/today/+page.svelte`.
- Likely shared UI extraction under `frontend/src/lib/components/` to avoid duplicating chip and summary logic.
- Frontend tests for standard list, grocery list, and Today views.
- No database, API contract, dependency, or Docker changes expected. Backend query ordering may remain as a stable transport order, but the frontend Today view is authoritative for displayed Today item sorting.
