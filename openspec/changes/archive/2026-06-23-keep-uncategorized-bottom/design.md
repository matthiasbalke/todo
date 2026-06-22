## Context

The frontend builds category groups with `groupByCategory`. That utility sorts real categories by `sortOrder`, adds the virtual uncategorized group with key `null` after real categories, assigns items to their matching group, and removes empty groups. This already gives the desired order in the standard list and grocery page, but the invariant is not called out in the spec and can be weakened by future category group sorting work.

The uncategorized group is not a backend category. It represents items whose `categoryId` is `null`, so it should remain a fallback bucket rather than becoming part of the user-managed category order.

## Goals / Non-Goals

**Goals:**

- Specify that the uncategorized group is always rendered after real category groups.
- Preserve real category ordering by persisted `sortOrder`.
- Preserve item drag-and-drop into the uncategorized group.
- Ensure any category group sorting work only sorts real categories.
- Add direct regression coverage for uncategorized-last ordering.

**Non-Goals:**

- Add backend storage for uncategorized group order.
- Create a synthetic category record for uncategorized items.
- Change category CRUD behavior or item category assignment.
- Change Today view grouping semantics beyond any shared utility behavior it already inherits.

## Decisions

- Keep the invariant in the grouping layer.
  Rationale: `groupByCategory` is the shared function used by list views that group by category, and it already has enough information to order real categories before the `null` bucket. Alternative considered: enforce this in each page component, but that would duplicate ordering rules and make future regressions more likely.

- Do not persist an uncategorized group position.
  Rationale: The requested behavior is an invariant, not user-configurable state. Persisting a virtual group position would introduce data model work that the product no longer needs. Alternative considered: store a list-level uncategorized sort value, but that conflicts with always-bottom behavior.

- If category group sorting is implemented, only real categories are sortable.
  Rationale: Users can curate category order while the uncategorized bucket remains a stable fallback at the bottom. Alternative considered: allow dragging uncategorized and snap it back on save, but that creates a misleading interaction.

## Risks / Trade-offs

- Active `sort-list-groups` artifacts currently say uncategorized can participate in sorting. Mitigation: update or supersede that portion before applying both changes so the implementation only sorts real category groups.
- Grocery mode also uses `groupByCategory`. Mitigation: keep the invariant in the shared utility and add tests that assert the order independently from a specific page.
- Empty groups are removed after grouping. Mitigation: test both mixed-category and uncategorized-only visible item sets so the last-position rule does not hide empty-group behavior changes.
