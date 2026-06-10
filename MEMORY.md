## ItemForm due-date picker

- `ItemForm.svelte` uses the shared `DatePicker` with nullable `string | null` state throughout initialization, submission, and new-item reset.
- The native date-input blur workaround is intentionally retained only for the category and recurrence selects.
- Integration coverage lives in `ItemForm.test.ts` and verifies existing values, selection, clearing, submission/reset, and new-form focus/cancel behavior.

## Textarea component

- `Textarea.svelte` is the shared multiline primitive with bindable string values, unique accessible IDs, descriptions, synchronous validation, native textarea prop/event forwarding, and configurable rows/resize behavior.
- `ItemForm.svelte` uses Textarea for notes with two rows and resizing disabled while preserving empty-string-to-null submission.
- The development `/components` route documents and demonstrates Textarea; its production redirect remains in `frontend/src/routes/components/+page.ts`.
