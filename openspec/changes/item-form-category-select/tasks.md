## 1. Select Label Support

- [x] 1.1 Add an optional typed `getOptionLabel` prop to `Select.svelte` and use it for selected-trigger and listbox option text while preserving existing rendering when omitted.
- [x] 1.2 Add Select unit tests proving custom labels are rendered and `onSelect` still receives the original option value.
- [x] 1.3 Add or retain Select regression coverage for primitive options without a label resolver.

## 2. ItemForm Category Integration

- [x] 2.1 Import the shared Select into `ItemForm.svelte` and replace the category native select with category-ID options headed by the empty `Uncategorized` value.
- [x] 2.2 Map category IDs to category names through `getOptionLabel`, including a visible fallback for a stale category ID.
- [x] 2.3 Connect Select initialization and `onSelect` handling to the existing `categoryId` state while preserving existing-item, `defaultCategoryId`, nullable submission, and new-item reset behavior.
- [x] 2.4 Remove the category-specific native blur workaround while leaving recurrence selection behavior unchanged.

## 3. ItemForm Integration Tests

- [x] 3.1 Test that ItemForm renders the shared Category Select, displays `Uncategorized` and category names, and no longer renders the category native select.
- [x] 3.2 Test existing category initialization, uncategorized initialization, and `defaultCategoryId` initialization.
- [x] 3.3 Test pointer selection, duplicate category names with distinct submitted IDs, uncategorized submission as `null`, and reset to the configured default or `Uncategorized`.
- [x] 3.4 Test keyboard navigation, selection, and Escape dismissal without invoking new-item cancellation.
- [x] 3.5 Update the picker blur coverage so it only asserts the retained recurrence native-select workaround.

## 4. Verification

- [x] 4.1 Run the focused Select and ItemForm test suites.
- [x] 4.2 Run the frontend Svelte type check.
- [x] 4.3 Validate the `item-form-category-select` OpenSpec change.
