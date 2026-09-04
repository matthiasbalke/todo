## 1. Component Contract

- [x] 1.1 Define an `ItemForm` draft shape covering title, notes, due date, category ID, assigned user IDs, and recurrence preset.
- [x] 1.2 Allow new-item `ItemForm` instances to initialize field state from an optional draft prop.
- [x] 1.3 Emit draft changes from `ItemForm` whenever any draft field changes, cloning assigned-user state before passing it to callers.
- [x] 1.4 Include cancel context so explicit Cancel can be distinguished from focus-loss minimization while preserving compatibility for existing callers.

## 2. List Detail Integration

- [x] 2.1 Store the add-item draft in the list detail page alongside add-form visibility state.
- [x] 2.2 Pass the stored draft into `ItemForm` when reopening the add-item form.
- [x] 2.3 Preserve the stored draft when focus loss minimizes the add-item form.
- [x] 2.4 Clear the stored draft after successful add submission and after explicit Cancel.
- [x] 2.5 Ensure a failed add submission leaves the draft available for correction or retry.

## 3. Verification

- [x] 3.1 Add or update `ItemForm` unit tests for draft initialization, draft change emission, successful-submit reset, explicit-cancel discard, and focus-loss minimization context.
- [x] 3.2 Add or update list detail page tests to verify the draft is restored after the form minimizes and reopens.
- [x] 3.3 Add or update e2e coverage for entering an add-item draft, moving focus outside the form, reopening it, and seeing the draft preserved.
- [x] 3.4 Run frontend checks and targeted tests for the changed component/page behavior.
