# Design

## Context

The application shell now makes the page content a fixed, independently scrolling `<main>` element. The notes editor is rendered inside that element. A fixed-position child therefore remains in the main element's stacking context, below the separately stacked global top chrome; the notes editor header is covered by that chrome.

The existing shared `Dialog` component already mounts overlays under `document.body`, which places them outside the scrolling content stacking context. The notes editor has intentionally different behavior and chrome, so it cannot directly use that component without changing its interaction contract. See the proposal and item-form-overhaul delta for the required behavior.

## Goals / Non-Goals

**Goals:**

- Render the fullscreen notes editor above the application shell so its Cancel/back and Save controls remain visible and interactive.
- Preserve the current fullscreen editor layout, keyboard behavior, focus return, and save and discard semantics.
- Cover the regression at the ItemForm component boundary.

**Non-Goals:**

- Redesigning the shared dialog component or changing other dialogs' dismissal behavior.
- Changing list drag-and-drop or application scrolling behavior.

## Decisions

### Mount the notes editor overlay under `document.body`

Use the established portal-action pattern to move the fullscreen editor overlay outside the app scroll container. Its existing `fixed inset-0 z-50` positioning can then be evaluated against the viewport and global chrome without being constrained by the `<main>` stacking context.

Keeping the overlay inside `<main>` and increasing its child z-index cannot resolve the issue because the fixed scroll container is itself a stacking context below the top chrome. Raising the whole `<main>` would also obscure the global header during normal navigation. Reusing the general `Dialog` component would require extending it for persistent fullscreen behavior and bespoke Cancel/Save chrome, which expands this focused fix.

### Retain the editor's current action and focus lifecycle

Keep Cancel/back, Save, Escape handling, the initial textarea focus, and return focus to the notes trigger in `ItemForm`. The portal only changes where the overlay is mounted; it does not alter draft ownership or how values are committed.

### Test visible header controls through the mounted dialog

Extend the ItemForm tests to assert that opening Notes exposes the dialog's Cancel/back control, centered title, and Save control, then retain assertions that Save commits and Cancel or Escape discards the draft. This verifies the interaction contract while allowing the portal implementation to remain internal.

## Risks / Trade-offs

- [A portal can leave an overlay node in the document if teardown is incomplete] → Use the same action cleanup pattern as the existing shared dialog and let component teardown remove the node.
- [Moving the node can affect component-test queries] → Scope tests to the named dialog and rely on test cleanup between renders.
- [A portal changes inherited layout context] → Preserve the editor's explicit viewport positioning, surface colors, width limit, and z-index classes.

## Migration Plan

1. Deploy as a frontend-only change with the component regression test.
2. Roll back by restoring the prior ItemForm overlay rendering if an unexpected portal interaction is found; no data migration or API change is involved.
