## Why

After an owner duplicates a list, the `Duplicate list` menu action remains disabled on the duplicated list until the user leaves and reopens it. This breaks the expected flow of duplicating a copy again, especially when creating several similar household lists from an existing template.

## What Changes

- Reset the frontend duplicate-in-progress state after successful duplication and navigation so the copied list can be duplicated immediately.
- Keep duplicate-submission protection while the duplicate API request is pending.
- Add frontend coverage for duplicating a list, landing on the copy, and seeing the duplicate action enabled again.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `list-duplication`: Clarify that the duplicate action is re-enabled after successful duplication so a duplicated list can be duplicated again without a full route reload.

## Impact

- Affected issue: GitHub #258, "Duplicated lists can not be duplicated again".
- Affected code: `frontend/src/routes/(app)/lists/[id]/+page.svelte` duplicate handler and menu state.
- Affected tests: `frontend/src/routes/(app)/lists/[id]/list-page.test.ts` for the duplicate flow.
- No backend API, database, or dependency changes are expected.
