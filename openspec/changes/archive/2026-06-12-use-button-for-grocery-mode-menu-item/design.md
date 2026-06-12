## Context

The standard list route's burger menu renders "Grocery mode" as a plain anchor with hand-written classes. The neighboring rows render through the shared Button with explicit alignment and font-weight props. Although the anchor targets the correct route, its native display and independently maintained styles create a small visual mismatch.

The route already imports SvelteKit's `goto` for post-delete navigation and imports the shared Button for the rest of the menu, so the replacement requires no new dependency or abstraction.

## Goals / Non-Goals

**Goals:**
- Render "Grocery mode" with the same shared Button primitive as neighboring menu actions.
- Match the existing menu row's left alignment, regular typography, spacing, neutral text, and hover treatment.
- Preserve client-side navigation to `/lists/{id}/grocery`.
- Preserve menu dismissal when the action is activated.
- Add focused regression coverage for semantics, styling, and navigation.

**Non-Goals:**
- Change the grocery-mode route or page behavior.
- Change other burger-menu actions or menu layout.
- Replace the reverse "Standard mode" anchor in the grocery page.
- Add link rendering support to the Button component.

## Decisions

### Use Button with programmatic SvelteKit navigation

Replace the anchor with `Button variant="bare"`, `align="start"`, and `weight="normal"`. Its click handler will close the menu and call `goto` with the current grocery-mode path.

This is preferred over extending Button to render an anchor because the requested row is presented as an action in an action menu, Button already supports the required visual contract, and the route already depends on `goto`. A polymorphic Button would broaden the shared API for a single consumer.

### Preserve existing row-specific styling

Retain the current full-width, padding, text size, neutral color, and hover background classes on the Button. Shared Button props will provide the alignment and regular font weight instead of duplicating those concerns in raw anchor classes.

### Verify behavior at the route level

The standard list menu test will query "Grocery mode" as a button, assert its shared Button presentation classes, activate it, and verify `goto('/lists/list-1/grocery')`. The test will also confirm the old link semantic is absent.

## Risks / Trade-offs

- [Button activation fails to navigate] → Assert the exact `goto` destination in the route test.
- [Menu styling remains different] → Assert the same alignment and weight classes used by neighboring menu actions.
- [Replacing a link removes browser link affordances] → This is intentional for consistency with the action menu; navigation remains keyboard accessible through native button semantics and SvelteKit routing.
- [Click handler ordering leaves the menu open] → Set `menuOpen` to false before invoking `goto` and cover activation in the route test.
