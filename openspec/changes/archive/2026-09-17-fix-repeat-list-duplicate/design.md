## Context

See `proposal.md` for motivation. The duplicate list operation is initiated from `frontend/src/routes/(app)/lists/[id]/+page.svelte` by setting a local `duplicating` state flag, calling the list store's duplicate operation, and navigating to the returned list ID. The menu button is disabled while `duplicating` is true.

Today the failure path resets `duplicating`, but the success path relies on navigation and does not explicitly clear the flag. When SvelteKit reuses the existing page component instance for navigation between `/lists/[id]` routes, that component-local state can carry over to the duplicated list route and leave the duplicate button disabled.

## Goals / Non-Goals

**Goals:**

- Keep the duplicate action disabled while the API request is pending.
- Ensure successful duplication and navigation leaves the destination list page with duplication available again.
- Cover the regression in the existing list page test suite.

**Non-Goals:**

- Change backend duplicate-list semantics, naming, authorization, or copied data.
- Replace the menu, alert, or navigation patterns used by the current page.

## Decisions

- Reset `duplicating` after the duplicate operation succeeds and navigation has been requested. This keeps the pending-request protection, but prevents route reuse from preserving stale pending state on the destination list.
- Add a guard at the start of `handleDuplicate` if one is not already present during implementation, so rapid duplicate activations cannot issue concurrent duplicate requests while the flag is true.
- Exercise the behavior at the page level with a frontend test that duplicates the current list, simulates arrival on the duplicated list route, reopens the menu, and verifies `Duplicate list` is enabled.

Alternative considered: force a full route reload after duplication. That would clear local state, but it would be heavier, less aligned with the existing SvelteKit navigation model, and unnecessary for this local-state bug.

## Risks / Trade-offs

- Resetting too early could allow double submission before navigation completes -> reset only after the duplicate API resolves and navigation has been requested, while preserving the pending-state guard.
- The route-reuse behavior is easy to miss in a unit-style component test -> structure the regression test around rerendering/updating the list page data after the mocked navigation, then inspect the destination menu state.
