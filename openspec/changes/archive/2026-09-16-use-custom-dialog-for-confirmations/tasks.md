## 1. Audit And Test Baseline

- [x] 1.1 Audit production frontend `confirm(...)` calls and manually defined modal shells, then verify the implementation scope by listing each migrated file in the change notes.
- [x] 1.2 Document that the item notes editor is excluded because it is a full-screen editor rather than a classic modal dialog, and verify this note appears in the implementation scope notes.
- [x] 1.3 Add or update list route tests for delete-list confirmation open, cancel, confirm, and failed delete behavior, and verify the targeted list route test file passes.
- [x] 1.4 Add or update item detail tests for delete-item confirmation open, cancel, confirm, and failed delete behavior, and verify the targeted item detail test file passes.

## 2. ConfirmDialog Component

- [x] 2.1 Add a reusable `ConfirmDialog` component that composes `Dialog` and `Button` for destructive confirmations, and verify component tests cover cancel, confirm, error text, and pending/disabled behavior.
- [x] 2.2 Add `ConfirmDialog` to the `/components` showcase with an interactive example, and verify the components page tests cover the new showcase section.

## 3. Dialog-Based Deletion Confirmations

- [x] 3.1 Replace the list deletion browser confirmation with `ConfirmDialog`, preserving current delete API calls, navigation, permissions, and error handling; verify no `confirm(...)` remains in the list route.
- [x] 3.2 Replace the item detail deletion browser confirmation with `ConfirmDialog`, preserving current delete API calls, navigation, permissions, and error handling; verify no `confirm(...)` remains in the item detail route.
- [x] 3.3 Ensure pending delete submissions disable or guard duplicate destructive actions and keep failures visible in the dialog or current workflow; verify through the added failure tests.

## 4. Shared Dialog Shell Migration

- [x] 4.1 Migrate `DeleteCheckedItemsDialog.svelte` to use `ConfirmDialog` or shared Dialog composition while preserving its public props, copy, loading state, cancellation behavior, and delete-checked tests.
- [x] 4.2 Migrate category configuration modal shell and nested delete-category confirmation to shared Dialog or ConfirmDialog composition where compatible, and verify category configuration tests still pass.
- [x] 4.3 Audit remaining production `role="dialog"` blocks; document why popovers and the item notes editor remain local, and verify the audit notes are included in the implementation summary.

## 5. MembersDialog Checkpoint

- [x] 5.1 Pause before migrating `MembersDialog.svelte` and run the targeted tests for ConfirmDialog, delete routes, delete-checked, and category configuration; verify failures, if any, are resolved before continuing.
- [x] 5.2 Migrate `MembersDialog.svelte` to shared Dialog composition while preserving member loading, invitation, role changes, removal behavior, and Select positioning; verify `MembersDialog` tests pass independently.

## 6. Verification

- [x] 6.1 Run `cd frontend && bun run check` and verify Svelte type-checking passes.
- [x] 6.2 Run targeted frontend Vitest suites for the migrated route and component files and verify they pass.
- [x] 6.3 Run `openspec validate use-custom-dialog-for-confirmations --strict` and verify the change artifacts are valid.
