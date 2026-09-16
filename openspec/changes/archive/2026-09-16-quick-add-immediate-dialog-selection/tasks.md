## 1. Shared Dialog Foundation

- [x] 1.1 Create a reusable dialog shell component for modal structure, accessible title labeling, title-bar close, Escape handling, outside dismissal, focus return, and common overlay/surface styling, and verify it with focused component tests or quick-add integration coverage.
- [x] 1.2 Migrate quick-add detail dialogs to the shared dialog shell without changing their accessible names, and verify existing quick-add dialog queries still find `Category`, `Due date`, `Recurrence`, `Assignees`, and `Notes` dialogs.
- [x] 1.3 Add the shared dialog shell to the components showcase with examples for opening, title-bar close, outside dismissal, Escape dismissal, body content, and optional footer actions, and verify the showcase test covers the new section.

## 2. Quick-Add Dialog State

- [x] 2.1 Update category, due date, recurrence, and assignee dialog handlers to apply selection changes directly to the pending quick-add draft, and verify the corresponding chips update before any Save action is used.
- [x] 2.2 Close category, due date, and recurrence dialogs immediately after a value is selected, and verify focus returns to the activating detail control.
- [x] 2.3 Preserve notes as an explicitly saved buffered dialog value, and verify notes still require Save before they affect submitted item data.

## 3. Dialog Controls And Dismissal

- [x] 3.1 Remove Save and Cancel footer actions from selection-oriented quick-add detail dialogs, remove Cancel footer actions from notes dialogs, and verify accessible dialog controls expose the title-bar close control.
- [x] 3.2 Add outside click/touch dismissal for quick-add detail dialogs through the shared dialog shell, and verify outside dismissal closes an untouched dialog or unsaved note editor without closing the quick-add composer.
- [x] 3.3 Keep focus return and quick-add focus-out preservation intact after title-bar close, outside dismissal, and selection changes, and verify focus returns to the activating detail control.

## 4. Submission And Regression Coverage

- [x] 4.1 Update quick-add submission tests so immediately applied category, due date, recurrence, and assignee values are included when pressing Enter in the title entry.
- [x] 4.2 Add regression coverage for multi-select assignee add/remove behavior where the dialog remains usable for multiple selections and closing or dismissing keeps already-applied assignee changes.
- [x] 4.3 Run `cd frontend && bun run test -- --run QuickAddItemForm.test.ts` and verify the focused component tests pass.
- [x] 4.4 Run `cd frontend && bun run check` and verify Svelte type-checking passes.
