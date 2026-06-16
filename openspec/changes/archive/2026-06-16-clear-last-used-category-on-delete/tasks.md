## 1. Default Category Normalization

- [x] 1.1 Add an `ItemForm` helper that resolves the effective new-item default category to a valid category ID or `''`.
- [x] 1.2 Use the effective default for new-item category initialization and post-submit reset.
- [x] 1.3 Keep valid default categories unchanged and submit uncategorized items as `null`.

## 2. List Page Persistence

- [x] 2.1 Derive the list page's effective `defaultCategoryId` from `lastCategoryId` only when it exists in the current category list.
- [x] 2.2 Clear `lastCategoryId` and the persisted list item defaults when the remembered category disappears.
- [x] 2.3 Ensure category deletion received through store/SSE updates also clears the stale default.

## 3. Verification

- [x] 3.1 Update `ItemForm.test.ts` to cover stale new-item defaults displaying `Uncategorized`, submitting `null`, and resetting to `Uncategorized`.
- [x] 3.2 Add or update list page/store tests to verify stale remembered category defaults are cleared after category removal.
- [x] 3.3 Run `cd frontend && bun run test -- --run` and `cd frontend && bun run check`.

## 4. Loaded Item Category Cleanup

- [x] 4.1 Add item-store support for clearing a deleted category from all loaded items.
- [x] 4.2 Wire category removal so local deletion and `category.deleted` SSE updates also uncategorize affected loaded items.
- [x] 4.3 Add store regression coverage for clearing deleted category assignments from loaded items.
