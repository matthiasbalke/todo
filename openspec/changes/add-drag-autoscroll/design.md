## Context

The affected frontend drag surfaces already use `svelte-dnd-action`: list group wrappers in `/lists`, list cards inside `ListGroupSection.svelte`, standard list items in `CategoryGroup.svelte`, and category rows in `CategoryConfigDialog.svelte`. Those components receive `consider` and `finalize` events, and some already track local drag state plus the shared `isDraggingAny` flag.

`svelte-dnd-action` already includes native auto-scroll for scrollable parents and `document.scrollingElement`. Its options include `useCursorForDetection`, which uses the cursor position for drop-zone detection without visually recentering the dragged element, and `delayTouchStart`, which can reduce accidental touch drags that should have remained native scrolling gestures.

The tuning pass confirmed the library can auto-scroll, but it also clarified the UX mismatch: page-level auto-scroll currently uses the physical viewport boundary, while users experience the visible app content column as the meaningful scroll boundary. The app shell already has stable top chrome and fixed bottom action surfaces; making `<main>` the primary scroll container aligns native scrolling and drag auto-scroll with that visual structure.

The missing behavior is independent from persistence. Reorder and move APIs should stay unchanged; this change should make the app content area a real scroll container so `svelte-dnd-action` can discover it as a scrollable parent and use its bounds for auto-scroll.

## Goals / Non-Goals

**Goals:**

- Make app routes feel like a mobile app shell: stable header/footer chrome with a scrollable main content pane.
- Configure affected `svelte-dnd-action` zones consistently so native auto-scroll works against the main content pane and dialog-contained scroll panes.
- Use cursor-based detection on affected zones when it improves boundary detection for larger cards without changing the dragged element's visual anchor.
- Verify page-level main content scrolling and bounded scroll containers such as the category configuration dialog body.
- Update document-scroll helpers so focus and rename flows scroll the content pane instead of assuming document scrolling.
- Keep tuning centralized enough that list groups, list cards, items, and category rows do not drift.

**Non-Goals:**

- Replace `svelte-dnd-action` or change drag persistence semantics.
- Add backend APIs, database changes, or new authorization rules.
- Add horizontal auto-scroll.
- Add configurable user preferences for trigger size or speed.
- Implement a custom scroll animation loop unless the tuned library behavior proves insufficient.
- Redesign the visual appearance of list pages beyond the scroll-shell structure needed for this behavior.

## Decisions

- Prefer tuning `svelte-dnd-action` options over adding custom auto-scroll.
  Rationale: the library already discovers scrollable parents and the document, runs auto-scroll during drag observation, and cleans up on drag lifecycle teardown. Reusing that path avoids a second scroll loop competing with the library. Alternative considered: add a custom helper with its own pointer tracking and animation loop, but that duplicates library behavior and adds lifecycle risk.

- Make `<main>` the primary scroll container for app routes.
  Rationale: users understand the visible content pane, not the physical viewport, as the scrollable work area. A real `overflow-y-auto` main pane gives `svelte-dnd-action` a scrollable parent whose top and bottom edges match that mental model. Alternative considered: keep document scrolling and add custom trigger zones around content bounds, but that would reimplement part of the drag library and still leave normal page scrolling using a different model.

- Keep the app shell height-bound rather than document-flow scrolling.
  Rationale: a mobile-app-like shell needs the viewport to contain the header, content pane, and bottom action surface as stable regions. The shell should own viewport height while `<main>` owns route content scrolling. This will likely reduce or remove the current need for large bottom padding reserves such as `pb-32`, but individual pages may still need modest internal spacing so final content is not hidden behind action chrome.

- Use `useCursorForDetection: true` on affected zones where large draggable cards make center-based detection feel late.
  Rationale: list cards and group wrappers can be tall enough that center-based detection may not reach the edge trigger area even when the user's pointer is clearly at the boundary. Cursor-based detection improves edge/drop detection without `centreDraggedOnCursor` visually moving the card under the pointer. Alternative considered: `centreDraggedOnCursor`, but that changes drag visuals more aggressively.

- Centralize shared DnD tuning options.
  Rationale: the app has several zones with similar expectations. A small shared options object or factory avoids copying magic option sets across components while still allowing each zone to keep its own `items`, `type`, `flipDurationMs`, and `dropTargetStyle` values. Alternative considered: inline each option change, but future tuning would be easy to miss.

- Use `delayTouchStart` only if touch verification shows accidental drags interfere with intended page scrolling.
  Rationale: the issue is about scrolling during active drag, not delaying drag start. `delayTouchStart` may improve touch ergonomics, but applying it blindly could make drag handles feel less responsive. Alternative considered: enable it everywhere immediately, but that changes the drag start interaction beyond the core issue.

- Verify the category configuration dialog through the library's scrollable-parent detection before adding explicit app-owned container handling.
  Rationale: the library's multi-scroller discovers scrollable parents from drop zones. The dialog body should work if the drop zone is inside the scrollable element and computed overflow exposes it. Alternative considered: pass a custom scroll container to app code, but the library does not expose that as a direct option.

- Keep admin route width behavior compatible with the app shell.
  Rationale: `(app)/+layout.svelte` already widens admin routes while normal app routes use `max-w-2xl`. The shell should preserve that width distinction while changing the vertical scroll owner. If admin pages expose very long operational tables, they should still scroll within the main pane rather than falling back to document scrolling.

- Keep permissions and mutation behavior at existing component boundaries.
  Rationale: auto-scroll should only run while existing drag behavior is active. Viewers and users without the relevant capability should never get drag handles or drop targets from this change.

## Risks / Trade-offs

- Moving scroll ownership from `document.scrollingElement` to `<main>` can affect focus scrolling, scroll restoration, and helpers that imperatively scroll the document -> Mitigation: add a small app-scroll utility or binding and update local helpers such as rename/focus flows to target the main scroller.
- Mobile viewport and keyboard resizing can behave differently with height-bound shells -> Mitigation: use dynamic viewport sizing where appropriate and verify add-item/focus flows on mobile-sized Playwright viewports.
- Fixed action footer spacing assumptions may become stale -> Mitigation: revisit `FixedActionFooter`, route bottom padding, and tests together so the footer behaves as app chrome rather than accidental overlay.
- Native library auto-scroll may still use a smaller edge trigger than users expect -> Mitigation: validate with browser-level drag tests against the main content pane and revisit only if the content-pane boundary still feels unreachable.
- Cursor-based detection could change drop-zone behavior for nested zones -> Mitigation: apply the option to affected zones consistently and test list groups, list cards, item groups, and category rows separately.
- Dialog scroll parent detection depends on computed overflow and DOM placement -> Mitigation: verify category dialog auto-scroll in a browser-level scenario before considering custom container handling.
- Touch tuning can make drag handles feel sluggish -> Mitigation: keep `delayTouchStart` conditional on observed touch problems instead of making it a default requirement.
