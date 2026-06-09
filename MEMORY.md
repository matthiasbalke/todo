## ItemForm due-date picker

- `ItemForm.svelte` uses the shared `DatePicker` with nullable `string | null` state throughout initialization, submission, and new-item reset.
- The native date-input blur workaround is intentionally retained only for the category and recurrence selects.
- Integration coverage lives in `ItemForm.test.ts` and verifies existing values, selection, clearing, submission/reset, and new-form focus/cancel behavior.
