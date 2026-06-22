## Context

The `/lists` overview already sorts persisted list group wrappers and keeps the virtual `Ungrouped` section outside the sortable zone at the bottom. Separately, the list detail and grocery views group todo items by category through `groupByCategory`, which keeps the virtual uncategorized category group after all real categories.

The active `keep-uncategorized-bottom` change made the category-group invariant explicit in `list-ui-capabilities`. This `sort-list-groups` change now needs to reflect that list group sorting is a different interaction and must not introduce category-group sorting behavior that can move uncategorized items above real categories.

## Goals / Non-Goals

**Goals:**

- Keep `/lists` list group wrapper sorting scoped to persisted list groups.
- Keep the virtual `Ungrouped` list section outside the `/lists` sortable zone and displayed after persisted groups.
- Preserve per-list category ordering and the uncategorized-last invariant when list group wrappers are reordered.
- Keep existing list-card drag-and-drop behavior independent from list group wrapper sorting.

**Non-Goals:**

- Add category group sorting to list detail or grocery views.
- Add a persisted order for the virtual uncategorized category group.
- Change item category assignment or item drag-and-drop behavior.
- Change backend list group APIs beyond the existing persisted list group order behavior.

## Decisions

- Treat list groups and category groups as separate concepts.
  Rationale: List groups organize list cards on `/lists`; category groups organize todo items inside an individual list. Sharing sorting behavior between them would create accidental coupling. Alternative considered: model both as generic sortable groups, but that would conflict with the uncategorized-last rule.

- Keep virtual groups outside sortable persisted groups.
  Rationale: `Ungrouped` on `/lists` and uncategorized inside list detail are fallback buckets, not user-managed group records. Alternative considered: include virtual groups in sortable arrays and correct their position after reorder, but that exposes a misleading drag target.

- Use existing tests as the implementation reference.
  Rationale: Current frontend tests already assert that `Ungrouped` is outside the list group sortable zone and that uncategorized category groups remain last. The planning artifacts should match that current behavior.

## Risks / Trade-offs

- Terminology can confuse list groups with category groups -> Mitigate by naming both explicitly in specs and tests.
- Future category sorting work could accidentally reuse list group wrapper sorting behavior -> Mitigate by keeping the uncategorized-last requirement in `list-ui-capabilities`.
