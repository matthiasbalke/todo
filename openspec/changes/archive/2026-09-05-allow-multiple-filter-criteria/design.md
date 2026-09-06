## Context

See `proposal.md` for motivation. Regular list filtering is currently client-side in `frontend/src/lib/utils.ts`, and assignment filtering is represented as one enum value: `all`, `none`, `me`, or `others`. Regular list preferences persist that enum in local storage through `frontend/src/lib/listPrefs.ts`; grocery mode also has an `assigneeFilter` value in saved preferences but currently does not expose assignment filter UI.

## Goals / Non-Goals

**Goals:**

- Represent regular list assignment filtering as a multi-select set of criteria.
- Preserve existing semantics for `none`, `me`, and `others` when only one criterion is selected.
- Treat selected assignment criteria as OR conditions inside the assignment filter group, while all other filter groups continue to combine with AND semantics.
- Restore older single-value saved preferences without breaking existing users' stored list preferences.
- Keep the change frontend-only and compatible with offline filtering.

**Non-Goals:**

- Add backend query parameters or server-side filtering.
- Change item assignment data modeling.
- Change due-date filtering from its current single-choice behavior.
- Add assignment filtering to Today, where assignment is already part of the Today source predicate.

## Decisions

1. Use an array of assignment criteria for the new filter state.

   The frontend should introduce a criteria list such as `assigneeFilters: Array<'none' | 'me' | 'others'>` and treat an empty array as the inactive `all assignees` state. If every available assignment criterion is selected, normalize it back to the inactive state because it matches the same items as `all assignees`. This maps directly to a multi-select UI and avoids the awkwardness of storing `all` beside active criteria.

   Alternative considered: store a single synthetic enum value such as `me-or-none`. That would handle issue #169 but would not generalize to multiple selected criteria.

2. Keep `others` semantics exclusive of the current user.

   Existing `others` filtering returns items assigned to at least one user where the current user is not among the assignees. The multi-select logic should preserve that predicate so `me + others` intentionally means assigned-to-me OR assigned-only-to-others.

   Alternative considered: redefine `others` as any item with another assignee, even when also assigned to the current user. That would be a behavior change unrelated to multi-select criteria and could surprise users.

3. Read legacy preferences and write the new shape.

   Preference loading should accept the old `assigneeFilter` value and normalize it into the new criteria array. Saving can write the new shape only; rollback is acceptable because local preferences are non-critical and can be reset by clearing local storage.

   Alternative considered: dual-write both old and new fields indefinitely. That adds compatibility surface without a clear consumer.

4. Show one assignment filter chip for the selected criteria.

   The active filter summary should continue to reset the assignment filter group as a single filter category. Its label should summarize the selected assignment criteria, for example `Assigned to me or not assigned`.

   Alternative considered: one chip per assignment criterion. That makes individual removal possible but changes the existing "clear one filter category" summary model and increases chip clutter on small screens.

## Risks / Trade-offs

- Legacy preference values may be malformed or partially migrated -> Normalize unknown values to the inactive assignment filter and keep existing error-tolerant local storage parsing.
- Multi-select assignment controls can be visually ambiguous if they still look like radio choices -> Use selected toggle/check states and keep `All items` as a clear command that empties the selected criteria.
- Active filter counts may become confusing if each assignment criterion increments the count -> Count assignment criteria as one active filter category to match the single summary chip.
- Selecting every assignment criterion is equivalent to all-assignee matching -> Normalize full selection to the inactive state so persisted preferences and summary chips do not claim a filter is active when no items are excluded.
- Grocery mode shares the filter type but does not currently expose assignment filtering -> Update shared types carefully and either normalize unused grocery preference state or leave grocery behavior unchanged with an inactive assignment filter.
