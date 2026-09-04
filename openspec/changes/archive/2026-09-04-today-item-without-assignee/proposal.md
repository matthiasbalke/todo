## Why

Single-user household lists often leave items unassigned because ownership is implicit. Those dated items should still surface in the Today experience so users do not miss due or overdue work just because no explicit assignee was selected.

## What Changes

- Include unassigned items with qualifying due dates in Today when their source list has exactly one member and the current user can read that list.
- Keep the existing assigned-to-current-user predicate for lists with more than one member.
- Apply the same qualification rule consistently to the Today items API and unfinished overview count.
- Preserve existing exclusions for items assigned only to someone else, undated items, future items, and inaccessible lists.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `today-view`: Change the Today qualification predicate so unassigned due or overdue items from single-member lists qualify for that sole member.

## Impact

- Backend Today SQL queries must account for list membership count while avoiding duplicate rows.
- Today count logic must match the item query exactly for incomplete items.
- Backend integration tests should cover single-member unassigned inclusion and multi-member unassigned exclusion.
- Frontend behavior should continue to consume the same Today API response shape without API contract changes.
