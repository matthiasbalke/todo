## Context

The standard list and grocery list pages each manage local `filters`, `sortField`, `sortDirection`, `activeFilterCount`, `dueDateValue`, and `sortFields` state. The Today page manages Today-specific `starredOnly`, `hideDone`, `sortField`, `sortDirection`, and `activeFilterCount` state. These pages expose filter and sort state inside their options menus, but the rendered item area only shows the filtered item count on the standard page and no visible state summary on grocery or Today.

Filtering and sorting are client-side. Standard and grocery list preferences are persisted through `listPrefs`; Today preferences are persisted through `todayPrefs`. Hide checked is currently controlled separately from the filter submenu, but it behaves as a filter because it hides completed items from the rendered list. The standard list supports starred, due date, assignee, hide checked, and sort preferences. Grocery mode supports starred, due date, hide checked, and sort preferences; it carries `assigneeFilter` in the shared type but does not expose assignee filtering in the grocery menu today. Today supports starred, hide checked, and non-manual sort preferences within its fixed assigned-due-or-overdue predicate.

Today source-list sections are ordered by list overview grouping/order, and source categories are ordered by source category order. Item order inside each Today category should come only from Today's own sort field and direction. Source-list item ordering can remain part of backend transport ordering or tie-breaking data, but it must not determine the displayed Today item order when Today preferences are loaded or changed.

## Goals / Non-Goals

**Goals:**

- Provide one reusable summary UI for standard list, grocery list, and Today pages.
- Keep the summary compact enough to fit between the page header and category groups on mobile.
- Make active filters individually resettable without opening the menu.
- Show sort field and direction outside the menu as an interactive summary control.
- Move Hide checked into the filter submenu so all item-hiding controls share the same mental model.
- Make Today item sorting consistently Today-specific from initial render onward.
- Preserve existing local preference save/delete behavior by updating the same page state variables.

**Non-Goals:**

- Add new filter types or sorting modes.
- Change backend APIs, persistence schema, or server-side filtering behavior.
- Redesign the list options menu.

## Decisions

1. Add a small shared component for the summary row.

   The component should live under `frontend/src/lib/components/` and accept already-resolved display data rather than owning list preference state. A practical API is:

   - `filters`: an array of active filter chips with stable ids, labels, and reset callbacks.
   - `sortLabel`: a string such as `Manual ascending` or `Due Date descending`.
   - `onSortClick`: a callback that opens or invokes the view's sort selection UI.
   - `visibleCount` and optional `totalCount` so the standard list can keep showing item count in the same area.

   Rationale: each page already computes the relevant state locally, and lifting state into a component would couple it to page-specific preference behavior. Passing display data keeps the component simple and testable.

   Alternative considered: keep duplicated markup in both pages. That is faster initially but likely repeats chip labels, clearing logic, and responsive layout.

2. Make sort visible as an interactive, non-resettable control.

   Sort is always active because the view always has a sort field and direction. The summary should expose that current state as a compact button so users can change the sort field and ascending/descending direction without opening the options menu first. It should not use an `x` or reset affordance; changing sort remains a selection flow, not a dismiss action.

   Implementation can either open the existing sort submenu from the page options menu or present the same sort choices through a lightweight popover anchored to the summary control. Reusing the existing sort field choices, direction toggle, and state transitions matters more than the exact popover ownership.

   Alternative considered: keep sort as passive text. That minimizes interaction complexity, but an always-visible sort indicator invites direct interaction and would otherwise force users back through the overflow menu.

   Alternative considered: make sort a chip that resets to list defaults. That conflates sorting with filters and requires defining reset semantics for view defaults, so it is less clear than opening sort selection.

3. Today sorting is independent from source-list item sorting.

   Today is a projection, so source-list preferences should not leak into item order inside Today source-list/category groups. The Today page should initialize from `todayPrefs` or the Today default, apply that sort before rendering items, and keep applying it after the user changes Today sort. Source-list group order and category order still control the surrounding section order.

   Alternative considered: display each source list using its own list sort until the user chooses a Today sort. That matches the observed inconsistency, but it makes the Today sort indicator misleading and changes ordering semantics after the first user interaction.

4. Move Hide checked into the filter submenu.

   `hideDone` affects which items are shown and is persisted with view preferences. It should live with the other filter controls, contribute to the active filter count, and appear as a resettable `Hide checked` chip so users can understand why completed items are absent.

   Alternative considered: leave Hide checked as a separate menu section and only mirror it in the summary. That preserves the existing menu layout, but it splits filtering behavior across multiple menu sections.

5. Build active filter descriptors in each page.

   The standard list page should include descriptors for `Starred only`, due date mode, assignee mode, and `Hide checked`. Grocery mode should include descriptors for `Starred only`, due date mode, and `Hide checked`; it should not surface assignee chips unless the grocery UI also exposes assignee filtering. Today should include descriptors for `Starred only` and `Hide checked`; it should not surface due-date or assignee chips because those are fixed by the Today qualification predicate.

   Rationale: standard, grocery, and Today views have different supported filters. Page-level descriptor creation keeps those differences explicit while the summary component remains generic.

6. Place the summary directly above category groups.

   The summary should replace or absorb the existing standard-list item count row and appear before grocery category sections and Today source-list sections. It should use wrapping inline chips and a muted sort label so it works on narrow screens without taking over the list.

## Risks / Trade-offs

- Duplicate descriptor logic can drift between pages → Keep labels and helpers small, and consider extracting helper functions only if tests show meaningful duplication.
- Chips may wrap to multiple lines on small screens → Use flex wrapping, compact spacing, and short labels.
- Screen readers need meaningful reset actions → Each chip control should expose an accessible label such as `Clear Starred only filter`.
- Tests may become sensitive to exact label text → Assert the user-visible labels and clear behavior that the issue requires, not implementation-specific DOM structure.

## Migration Plan

No data migration is required. Deploy as a frontend-only change; rollback by reverting the component, page integration, and tests.
