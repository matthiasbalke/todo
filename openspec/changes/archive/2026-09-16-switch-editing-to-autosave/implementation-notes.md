## Save/Cancel Inventory

- `frontend/src/routes/(app)/lists/+page.svelte`: list creation and group creation used fixed-footer forms with Create/Add and Cancel buttons.
- `frontend/src/lib/components/ListForm.svelte`: list create/edit form rendered Create/Save and Cancel buttons.
- `frontend/src/lib/components/ListGroupSection.svelte`: group rename rendered Save and Cancel buttons.
- `frontend/src/routes/(app)/lists/[id]/+page.svelte`: list title editing already committed on blur/Enter, quick-add used Add and Cancel buttons.
- `frontend/src/routes/(app)/lists/[id]/grocery/+page.svelte`: list editing used `ListForm` from the menu.
- `frontend/src/lib/components/ItemForm.svelte`: item edit form rendered form-level Save and Cancel buttons.
- `frontend/src/routes/(app)/lists/[id]/items/[iid]/+page.svelte`: item save navigated away after the explicit Save button.
- `frontend/src/lib/components/QuickAddItemForm.svelte`: quick-add rendered form-level Add and Cancel buttons; focus-out already minimized the form through the parent while keeping drafts unless explicitly canceled.

Out of scope by design: fullscreen notes editor Save/Cancel, destructive confirmations, account/security/admin/member workflows, and category management.
