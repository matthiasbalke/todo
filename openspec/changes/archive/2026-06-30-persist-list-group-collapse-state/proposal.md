## Why

List group sections on `/lists` are collapsible, but their open/closed state is currently component-local and resets when the user navigates away, reloads, or returns later on the same device. Category group collapse state is already persisted locally, so list groups should behave consistently.

## What Changes

- Persist list group collapsed state locally per user/device for the `/lists` overview.
- Restore each persisted list group's collapsed state when the list overview is opened again.
- Include the virtual Ungrouped section in the same local collapse behavior.
- Keep list group ordering, list assignment, and backend APIs unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `list-ui-capabilities`: Add local persistence requirements for list group open/closed state on the list overview.

## Impact

- Frontend list overview route: load and save group collapsed state.
- `ListGroupSection.svelte`: accept controlled collapsed state and emit changes instead of keeping the state only internally.
- New or updated local preference helper/tests for list group collapsed state.
- Component/page tests covering restore and persistence behavior.
- No backend, API, database, or dependency changes.
