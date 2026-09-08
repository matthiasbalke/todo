## 1. Read-Only Item Detail Layout

- [x] 1.1 Update `ItemDetails` to render disabled title and starred state in one row with starred after title and no completion/status indicator, and verify by inspecting the rendered viewer item detail page.
- [x] 1.2 Render Category, Due Date, Recurrence, Assigned to, and Notes with the regular item form components in disabled state and in the editable form order, and verify the viewer rendering visually matches the edit form controls without allowing edits.
- [x] 1.3 Keep audit metadata below Notes in the same placement as edit mode, and verify the viewer detail page still shows created/updated metadata below the disabled notes field.
- [x] 1.4 Preserve owner/editor item detail behavior, and verify the existing editable form with Save and Delete item actions still renders for both roles.

## 2. Frontend Tests

- [x] 2.1 Add or update viewer item detail tests to assert the title row order, disabled control usage, absence of completion/status indicator, post-title field order, audit placement below notes, and absence of save/delete actions, and verify with `cd frontend && bun run test -- --run 'src/routes/(app)/lists/[id]/items/[iid]/item-page.test.ts'`.
- [x] 2.2 Update shared `TextInput` and `Textarea` styling to keep a white resting background, use a muted hover background, and apply opacity-based disabled treatment matching other controls, and verify their component tests cover the class behavior.
- [x] 2.3 Update `DatePicker` trigger height and arrow affordance to match `Select` and `CategorySelect`, and verify `DatePicker` component tests cover the trigger classes and icon.
- [x] 2.4 Run frontend checks for the touched code and verify `cd frontend && bun run check` succeeds.
