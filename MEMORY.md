## ItemForm due-date picker

- `ItemForm.svelte` uses the shared `DatePicker` with nullable `string | null` state throughout initialization, submission, and new-item reset.
- The native picker blur workaround is intentionally retained only for the recurrence select.
- Integration coverage lives in `ItemForm.test.ts` and verifies existing values, selection, clearing, submission/reset, and new-form focus/cancel behavior.

## ItemForm category select

- `ItemForm.svelte` uses the shared `Select` with category IDs as option values and category names as display labels; the empty string displays as `Uncategorized` and submits as `null`.
- `Select.svelte` supports an optional `getOptionLabel` resolver while preserving primitive option rendering and original option values in `onSelect`.
- Category integration coverage verifies defaults, stale IDs, duplicate names, submission/reset, keyboard interaction, and new-form focus/cancel behavior.

## Textarea component

- `Textarea.svelte` is the shared multiline primitive with bindable string values, unique accessible IDs, descriptions, synchronous validation, native textarea prop/event forwarding, and configurable rows/resize behavior.
- `ItemForm.svelte` uses Textarea for notes with two rows and resizing disabled while preserving empty-string-to-null submission.
- The development `/components` route documents and demonstrates Textarea; its production redirect remains in `frontend/src/routes/components/+page.ts`.
