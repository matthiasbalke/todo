## Why

Dragging lists or list items across long screens currently requires users to move the dragged card outside the visible content area and close to the physical viewport edge before auto-scroll starts. Making the app content area itself the primary scroll surface makes drag-and-drop and normal scrolling feel more like a mobile app with stable header and footer chrome.

## What Changes

- Make the app shell's main content area the primary scroll container for app routes, with header and bottom action surfaces behaving as stable app chrome.
- Let existing `svelte-dnd-action` auto-scroll use that main scroll container's visible top and bottom boundaries instead of the physical viewport edge for page-level list and item dragging.
- Keep the tuned `svelte-dnd-action` cursor detection for drag accuracy without visually recentering the dragged element.
- Ensure focus/rename/form helpers that currently scroll the document target the app content scroller where appropriate.
- Preserve dialog-contained scrolling, including category configuration dialog drag auto-scroll inside the dialog body.
- Keep existing drag permissions, reorder persistence, and backend APIs unchanged.

## Capabilities

### New Capabilities

### Modified Capabilities
- `list-ui-capabilities`: Adds viewport edge auto-scroll to existing list and list item drag-and-drop interactions.

## Impact

- Frontend app shell layout around `(app)/+layout.svelte`, route content sizing, and fixed action footer behavior.
- Frontend drag-and-drop behavior around `svelte-dnd-action` zones on `/lists`, list group sections, category configuration, and standard list item/category groups.
- Shared frontend DnD option constants or helpers so affected drag zones keep consistent tuning.
- Frontend scroll helpers that currently use `document.scrollingElement`.
- Frontend component and browser-level tests that verify the main content scroller, affected drag surfaces, dialog scrolling, and mobile-sized layouts.
- No backend API, persistence schema, or authorization changes.
