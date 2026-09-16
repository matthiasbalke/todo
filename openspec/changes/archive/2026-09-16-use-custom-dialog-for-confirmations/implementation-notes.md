## Implementation Scope Notes

### Migrated Files

- `frontend/src/lib/components/ConfirmDialog.svelte`
- `frontend/src/lib/components/DeleteCheckedItemsDialog.svelte`
- `frontend/src/lib/components/CategoryConfigDialog.svelte`
- `frontend/src/lib/components/MembersDialog.svelte`
- `frontend/src/routes/(app)/lists/[id]/+page.svelte`
- `frontend/src/routes/(app)/lists/[id]/items/[iid]/+page.svelte`
- `frontend/src/routes/components/+page.svelte`

### Test Coverage Added Or Updated

- `frontend/src/lib/components/ConfirmDialog.test.ts`
- `frontend/src/routes/components/components-page.test.ts`
- `frontend/src/routes/(app)/lists/[id]/list-page.test.ts`
- `frontend/src/routes/(app)/lists/[id]/items/[iid]/item-page.test.ts`

### Exclusions

- `frontend/src/lib/components/ItemForm.svelte` keeps its notes editor local because it is a full-screen focused editor with a Save/Cancel header, not a classic modal confirmation or management dialog.
- `frontend/src/lib/components/DatePicker.svelte` keeps its local `role="dialog"` because it is a popover-style calendar picker with control-specific positioning and keyboard semantics, not an app modal shell.
