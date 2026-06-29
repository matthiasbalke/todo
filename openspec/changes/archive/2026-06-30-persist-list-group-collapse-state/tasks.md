## 1. Local State Helper

- [x] 1.1 Add a frontend localStorage helper for list overview group state with `collapsed: Record<string, boolean>`.
- [x] 1.2 Use a stable storage key for the overview preference and a reserved key for the virtual Ungrouped section.
- [x] 1.3 Add Vitest coverage for empty state, round-trip persistence, per-browser localStorage errors, and deletion.

## 2. Component Wiring

- [x] 2.1 Update `ListGroupSection.svelte` to accept an optional controlled `collapsed` value.
- [x] 2.2 Add a collapse-change callback/event so the parent route can persist toggles.
- [x] 2.3 Preserve existing default behavior when the component is rendered without controlled collapse props.
- [x] 2.4 Confirm list card drag-and-drop and list group drag handles still behave as before when a section is expanded.

## 3. List Overview Integration

- [x] 3.1 Load saved list group collapse state in `frontend/src/routes/(app)/lists/+page.svelte`.
- [x] 3.2 Pass collapsed state into each persisted group section and save changes when a group is toggled.
- [x] 3.3 Pass and save collapsed state for the virtual Ungrouped section using the reserved local key.
- [x] 3.4 Delete the saved overview state when all collapsed state entries are cleared or no state is worth persisting.

## 4. Verification

- [x] 4.1 Update `ListGroupSection` tests for controlled collapse, callback emission, and uncontrolled fallback behavior.
- [x] 4.2 Add or update list overview tests proving collapsed persisted groups and the Ungrouped section are restored.
- [x] 4.3 Run `cd frontend && bun run test -- --run`.
- [x] 4.4 Run `openspec validate persist-list-group-collapse-state --strict`.
- [x] 4.5 Run `openspec status --change persist-list-group-collapse-state` and confirm the change is apply-ready.
