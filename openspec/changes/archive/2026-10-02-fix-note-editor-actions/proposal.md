# Proposal

## Why

After the drag-and-drop scrolling redesign, the fullscreen notes editor no longer shows its Cancel and Save header actions. This prevents people from reliably saving or discarding note changes, despite those actions being part of the required editor workflow.

## What Changes

- Restore a visible, usable editor header with Cancel/back and Save actions whenever the fullscreen notes editor is open.
- Keep the Notes title centered and ensure the header remains reachable in the app's scroll layout on desktop and touch devices.
- Add regression coverage for the visible action chrome and the existing save and cancel behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `item-form-overhaul`: Ensure the fullscreen notes editor consistently exposes its required Cancel/back, title, and Save chrome after application layout and scrolling changes.

## Impact

- Affected code: `frontend/src/lib/components/ItemForm.svelte` and its component tests; potentially the shared application scroll/layout styling that governs the editor viewport.
- APIs and dependencies: none.
