## Why

The add-item flow currently expands into the full item form, which makes quick entry feel heavier than necessary for common list use. Issue #70 proposes a title-first quick-add surface where optional fields stay available through focused icon dialogs while Enter still creates the item with all draft details.

## What Changes

- Replace the regular list page's new-item expanded footer with a compact quick-add composer centered on the title input.
- Show small icon controls for category, due date, recurrence, assignment, and notes above or near the title input.
- Open a focused dialog for each optional detail when its icon is activated, using the existing item data contract for category, due date, recurrence, assignees, and notes.
- Preserve the in-progress title and optional detail values while the user opens and closes detail dialogs.
- Submit the item from the title input with Enter, including every optional value set through the detail dialogs.
- Keep successful submit, failed submit, explicit cancel, and focus-out draft preservation behavior consistent with the existing add-item workflow.
- Keep existing edit-item form behavior unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `item-form-overhaul`: Define the quick-add composer and detail-dialog interactions for creating new items.

## Impact

- Frontend list detail add-item UI in `frontend/src/routes/(app)/lists/[id]/+page.svelte`.
- Item form or new quick-add components under `frontend/src/lib/components/`.
- Existing shared controls for category, date, recurrence, assignee multi-select, notes editing, icons, buttons, and fixed action footer.
- Frontend unit tests for `ItemForm` and list page add-item behavior; no backend API or database changes expected.
