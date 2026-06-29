## Context

The `/lists` overview renders persisted list groups and the virtual Ungrouped section through `ListGroupSection.svelte`. The component currently stores `collapsed` with local Svelte state, so expanded/collapsed choices are lost whenever the component is recreated.

Regular list category groups already persist collapse state locally with a small localStorage helper, loaded by the route and passed into `CategoryGroup.svelte`. This change should follow that pattern for overview list groups.

## Goals / Non-Goals

**Goals:**

- Persist collapsed state for persisted list groups and the virtual Ungrouped section on the same device.
- Restore state when the user returns to `/lists` or reloads the app.
- Keep the preference resilient when localStorage is unavailable or blocked.
- Preserve existing list group sorting and list drag-and-drop behavior.

**Non-Goals:**

- Sync collapse state between devices or users.
- Add backend fields, API endpoints, migrations, or SSE events.
- Change the persisted order or membership of list groups.
- Persist the Today overview entry collapse state; Today is not a collapsible group section.

## Decisions

1. Store overview collapse state in a dedicated localStorage helper.

   Use a new helper such as `listGroupState.ts` with a single `collapsed: Record<string, boolean>` map. This mirrors `listCategoryState.ts`, keeps preference IO out of `ListGroupSection.svelte`, and gives Vitest a focused unit surface for blocked/quota localStorage behavior.

   Alternative considered: extend `listPrefs.ts`. That helper is keyed per individual list and stores detail-page filters/sort state, while this preference belongs to the overview across groups, so mixing them would make the key ownership unclear.

2. Use stable local keys for persisted and virtual groups.

   Persist real groups under their group IDs. Persist the virtual Ungrouped section under a reserved key such as `__ungrouped__`, avoiding collision with real group IDs.

   Alternative considered: use `null` or the displayed label. Object keys coerce `null` to a string and display labels can change or be localized, so a reserved implementation key is less ambiguous.

3. Make `ListGroupSection` controlled by the route.

   Add `collapsed` and `oncollapsedchange` props with a default that preserves existing behavior for isolated component use. The `/lists` route owns the persisted map, passes each section's value, and updates the helper when a section changes.

   Alternative considered: let `ListGroupSection` call localStorage directly. That would couple the reusable component to one route's persistence policy and make tests less focused.

## Risks / Trade-offs

- Stale keys for deleted groups can remain in localStorage -> harmless, and future cleanup can prune saved keys against loaded group IDs if needed.
- localStorage can throw in private browsing or restricted environments -> helper catches read/write/remove errors and the UI falls back to expanded sections.
- Controlled props can disturb drag-and-drop state if they cause unnecessary remounting -> keep section keys stable and only update the collapsed map on toggle.
