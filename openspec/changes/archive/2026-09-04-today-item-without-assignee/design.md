## Context

See `proposal.md` for motivation. Today currently qualifies items through native SQL in `TodayRepository`: both the item query and unfinished count start from `item_assignments`, which means unassigned items are impossible to return. The response already supports empty `assignedUsers`, so the API shape does not need to change.

## Goals / Non-Goals

**Goals:**

- Make Today qualification include unassigned due or overdue items from lists where the authenticated user is the only member.
- Keep multi-member lists assignment-explicit so shared lists do not show unclaimed work in every member's Today view.
- Keep `GET /api/today` and `GET /api/today/count` behavior consistent.
- Preserve existing ordering, source-list grouping data, role exposure, timezone handling, and frontend DTOs.

**Non-Goals:**

- No schema migration or assignment backfill.
- No frontend filter or display redesign.
- No change to regular list assignee filters or item assignment editing.
- No new separate this-week route unless implementation discovers an existing view backed by the same Today predicate.

## Decisions

1. Drive Today from readable list membership plus a qualification predicate.

   The item query should join `todo_items` to the current user's `list_memberships`, then left join the current user's assignment for the item. The item qualifies when it is due on or before the user's local date and either that assignment exists or the item has no assignments and the source list has exactly one member.

   Alternative considered: union the current assignment query with a second unassigned single-member query. A single predicate is easier to keep aligned with the count query and avoids subtle differences in ordering or access checks.

2. Use aggregate existence checks for assignment and membership counts.

   The single-member branch should be expressed with `NOT EXISTS` for item assignments and an exact membership count for the source list. This avoids duplicate rows from joining all list members or all item assignments.

   Alternative considered: join all memberships and group by item. That adds more grouping columns to a projection query that already returns many fields and increases the risk of changing sort behavior.

3. Keep assigned user decoration separate from qualification.

   `TodayService` already loads assigned users per returned item. Unassigned qualifying items should naturally produce an empty `assignedUsers` list without DTO changes.

   Alternative considered: synthesize the sole list member as an assignee in the response. That would blur the difference between implicit responsibility and explicit assignment, and would mutate visible item semantics.

## Risks / Trade-offs

- Query drift between item results and count -> keep the qualification predicate structurally identical in both SQL queries and cover both endpoints in integration tests.
- Membership count performance on large lists -> use correlated checks against indexed list memberships; this is acceptable for the current small household-list domain.
- Ambiguous "this week" wording in issue 172 -> implement against the existing Today capability first; only touch another view if the codebase exposes one using the same due-item predicate.

## Migration Plan

No data migration is required. Deploying the backend query change immediately makes previously hidden unassigned single-member due items appear in Today and in the overview count. Rollback is the previous query behavior.
