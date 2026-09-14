## 1. Component Structure

- [x] 1.1 Add a dedicated quick-add component for regular list item creation and verify it renders an item title entry plus category, due date, recurrence, assignee, and notes icon controls in a component test.
- [x] 1.2 Implement quick-add draft initialization, change emission, successful-submit reset, and failed-submit preservation using the existing add-item draft contract; verify draft lifecycle tests cover restore, reset, and failure cases.
- [x] 1.3 Add shared quick-add submit mapping for title, notes, nullable category, nullable due date, selected assignees, and recurrence preset conversion; verify submitted `TodoItem` payloads match the existing add-item API contract.

## 2. Detail Dialogs

- [x] 2.1 Implement the category detail dialog with the shared category selector and verify saving, canceling, nullable uncategorized selection, and focus return behavior.
- [x] 2.2 Implement the due-date detail dialog with the shared date picker and verify saving, clearing, canceling, and focus return behavior.
- [x] 2.3 Implement the recurrence detail dialog with the shared recurrence labels and value conversion; verify saving a preset and saving no recurrence submit the expected recurrence rule values.
- [x] 2.4 Implement the assignee detail dialog with the shared multi-select and avatar display; verify multiple saved assignees are included in submission and canceled changes are discarded.
- [x] 2.5 Implement the notes detail dialog with accessible save/cancel behavior and verify saved notes submit, canceled notes do not, and focus returns to the notes icon.

## 3. List Page Integration

- [x] 3.1 Replace the regular list page's add-item `ItemForm` usage with the quick-add component while keeping `FixedActionFooter`, permissions, default category, categories, members, submit handler, and cancel handler wired; verify list-page tests show editors can open quick-add and viewers cannot.
- [x] 3.2 Preserve focus-out minimization and explicit cancel behavior around the quick-add composer and its dialogs; verify reopening restores drafts after focus-out and clears drafts after explicit cancel.
- [x] 3.3 Keep the existing edit-item form path unchanged and verify current item form tests for edit behavior still pass.

## 4. Verification

- [x] 4.1 Update all existing frontend tests that cover the add-item form to expect the quick-add composer, stateful icon/chip controls, detail dialogs, and no alternate full-form create flow; verify the updated frontend tests pass with `bun run test -- --run` in `frontend/`.
- [x] 4.2 Update or add focused frontend tests for Enter submission from the title entry, including title-only and optional-detail submissions; verify `bun run test -- --run` passes in `frontend/`.
- [x] 4.3 Update all existing Playwright e2e tests that cover add-item form behavior to expect the quick-add composer and detail-dialog workflow; verify the relevant e2e specs pass against the configured test environment.
- [x] 4.4 Run Svelte type checking and verify `bun run check` passes in `frontend/`.
- [x] 4.5 Run OpenSpec validation for `redesign-add-item-form` and verify the change passes validation.
- [x] 4.6 Keep the quick-add detail controls in a single horizontally scrollable row after saved chip values make the toolbar wider than the composer; verify component coverage checks the non-wrapping scroll layout.
- [x] 4.7 Match quick-add saved-value pills to the list sort/filter chip style and add per-field remove controls that clear saved optional values; verify focused component and list-page tests pass.
- [x] 4.8 Keep the quick-add composer open when a saved-value pill remove button is clicked inside the form; verify clearing a disappearing pill does not emit a focus-out cancel.
