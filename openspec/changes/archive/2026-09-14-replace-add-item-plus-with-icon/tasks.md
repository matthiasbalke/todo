## 1. Regular List Add-Item Action

- [x] 1.1 Update the collapsed regular list fixed-footer add-item button to render the existing decorative `plus` icon before the visible `add item` label, and verify the button still opens the add-item form in the browser or unit test.
- [x] 1.2 Preserve the existing bare, borderless, left-aligned large button styling and verify the action remains visually compact without displaying the old literal `+ add item` text.

## 2. Tests and Validation

- [x] 2.1 Update regular list page tests to query the add-item action by `add item`, assert the old literal `+ add item` text is absent, and verify the relevant Vitest tests pass.
- [x] 2.2 Run `openspec validate replace-add-item-plus-with-icon --strict` and verify the change artifacts are valid.
