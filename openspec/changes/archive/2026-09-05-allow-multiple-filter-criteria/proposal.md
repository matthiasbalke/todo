## Why

The current assignment filter only allows one assignment criterion at a time, so a user cannot view items assigned to them together with unassigned items while excluding items assigned only to other people. GitHub issue #169 requests multi-criteria filtering for this common household workflow.

## What Changes

- Allow regular list assignment filtering to combine multiple assignment criteria.
- Support selecting both `Assigned to me` and `Not assigned` so the visible list includes owned work plus unclaimed work and excludes items assigned only to others.
- Preserve the existing single-selection behavior for due-date filters and the existing independent filters for starred-only and hide-checked.
- Persist the combined assignment filter in per-list local preferences and restore it on reload.
- Keep item filtering client-side so offline behavior remains unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `list-ui-capabilities`: Regular list views shall support multi-select assignment filtering and represent combined assignment filters in the active filter summary.

## Impact

- Frontend filter state, local preference serialization, and filter utility logic.
- Regular list filter menu controls and active filter chips.
- Frontend unit/component tests for assignment filter combinations and persisted preferences.
- No backend API, database, SSE, or dependency changes are expected.
