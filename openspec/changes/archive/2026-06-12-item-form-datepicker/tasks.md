## 1. ItemForm DatePicker Integration

- [x] 1.1 Import the shared DatePicker into `ItemForm.svelte` and replace the native due-date input with a labeled DatePicker.
- [x] 1.2 Change ItemForm due-date state initialization, submission, and new-item reset behavior to use `string | null` directly.
- [x] 1.3 Remove the native date input's picker-blur workaround while preserving category and recurrence picker behavior.

## 2. ItemForm Integration Tests

- [x] 2.1 Update existing due-date and focus tests to query the DatePicker through its accessible label and user-visible controls.
- [x] 2.2 Add tests for existing dated and undated item values, date selection, clearing, submitted ISO/null values, and reset after successful creation.
- [x] 2.3 Add regression tests proving calendar navigation, selection, clearing, and Escape dismissal do not cancel a new-item form and return focus as specified.

## 3. Verification

- [x] 3.1 Run the focused `ItemForm` and `DatePicker` test suites.
- [x] 3.2 Run frontend type checking and resolve any Svelte or TypeScript errors introduced by the migration.
- [x] 3.3 Validate the `item-form-datepicker` OpenSpec change.
