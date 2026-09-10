## Context

See `proposal.md` for motivation. The `/lists` overview renders persisted and virtual list group sections through the shared list group section component. Persisted groups currently expose a drag handle, group label, collapse/expand chevron, and group options menu; the virtual Ungrouped section omits the menu. The same overview uses a fixed action footer for compact list and group creation actions.

## Goals / Non-Goals

**Goals:**

- Reorder the persisted list group header controls so the group options menu sits immediately before the collapse/expand chevron.
- Preserve menu, collapse, rename, delete, drag handle, and keyboard behavior.
- Keep persisted list groups and the virtual Ungrouped section visually aligned after the reorder.
- Left-align the primary `new list` footer action content without changing the adjacent group creation icon action.
- Cover the control order with focused frontend tests.

**Non-Goals:**

- Changing group persistence, drag-and-drop ordering, list-card ordering, or local collapsed-state storage.
- Introducing new shared layout primitives or changing list detail/category group headers.
- Changing the menu contents, labels, icons, or permissions.
- Changing fixed footer behavior, expansion state, safe-area spacing, or creation form flow.

## Decisions

- Update the list group section header layout in place. This keeps the change scoped to the component that already owns group menu and collapse behavior, while avoiding changes to stores, APIs, or parent page data flow.
- Treat the chevron as the terminal header control. The title area should continue to toggle collapse, and the group options button should remain a separate button whose click does not bubble into collapse.
- Keep the Ungrouped section without a menu. Its header should retain compatible spacing and the same right-side chevron position so it lines up with persisted group headers.
- Keep the footer's existing action structure and adjust only the primary `new list` button alignment. This preserves the flexible width relationship between the list creation action and the group icon action.
- Verify order with DOM-position tests and preserve interaction tests for menu opening and collapse toggling. This is more stable than relying on screenshots for a small control-order change.
- Verify footer alignment with a component-level class or DOM assertion plus existing behavior that opens the list creation form.

## Risks / Trade-offs

- Header flex changes could shrink long group names unexpectedly -> keep the title area `min-w-0` with truncation and fixed-size icon buttons.
- Moving the menu nearer to the collapse control could accidentally trigger collapse through event propagation -> keep explicit event handling coverage that menu activation does not change collapsed state.
- Existing tests may assert broad header text or button ordering -> update only expectations that describe the intentional new order.
- Changing the primary footer button alignment could disturb compact spacing with the group icon action -> keep the existing flex sizing and only change content alignment inside the primary action.
