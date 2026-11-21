# Proposal

## Why

[Issue #314](https://github.com/matthiasbalke/todo/issues/314) asks for an Agile backlog that users can manually arrange as their plans change. Existing list ordering and Today grouping cannot express a personal sequence across lists without affecting source organization.

## What Changes

- Add an account setting to enable or disable Agile, disabled by default for existing and new users. Disabling preserves the personal backlog while hiding Agile navigation and selection controls.
- Add a personal Agile selection control for existing items and a dedicated `/agile` view linked from the list overview.
- Show selected items from all accessible lists in one manually ordered sequence, with source-list context.
- Persist selection and order per user across devices; append newly selected unfinished items after existing unfinished work and above checked items and support mouse, touch, and keyboard reordering.
- Keep source item properties, source-list order, and other users' planning unchanged by selection and reorder actions.
- Respect source permissions for item actions while allowing viewers to manage their personal selection and order.
- Retain completed selections in their saved planning slots while displaying them below unfinished items; allow unfinished-item reordering with or without Hide checked. New recurring occurrences inherit personal Agile selections from their immediate parent at completion and append to each selecting user’s backlog until explicitly removed; duplicated items start unselected.

## Capabilities

### New Capabilities

- `agile-planning`: Personal cross-list selection, persistent manual ordering, navigation, lifecycle, permissions, and refresh behavior.

### Modified Capabilities

None. Existing viewer restrictions continue to govern source-item mutation; personal planning is independent of those capabilities.

## Impact

- Backend: persisted `agileViewEnabled` user preference and preference/profile API updates, new Flyway migration and personal planning persistence, authenticated query/selection/reorder APIs, membership checks, transactional ordering, and integration coverage.
- Frontend: Agile API/store, overview entry and count, selection controls on existing item details and cards, flat Agile page, drag handling and keyboard controls, return navigation, and tests.
- Documentation: update `docs/requirements.md` with personal planning data and API contracts.
- Reuse existing Svelte drag-and-drop, semantic components, and authentication. No new runtime dependency is planned.
