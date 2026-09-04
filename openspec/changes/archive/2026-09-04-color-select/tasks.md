## 1. Shared Select Display Support

- [x] 1.1 Add optional Svelte snippet support for selected-value and option-content rendering to `frontend/src/lib/components/Select.svelte` while keeping `getOptionLabel` as the source for input text, filtering, and accessible labels.
- [x] 1.2 Ensure custom option content preserves existing listbox roles, selected/focused states, click handling, keyboard navigation, and typed option values for consumers without render hooks.

## 2. CategorySelect Component

- [x] 2.1 Create `frontend/src/lib/components/CategorySelect.svelte` as a thin adapter around the shared `Select`.
- [x] 2.2 Implement category lookup helpers in `CategorySelect` that resolve a category ID to its name and configured color.
- [x] 2.3 Render a small circular color indicator before each real category option with a configured color in the dropdown.
- [x] 2.4 Reserve the same leading swatch space for real category options without a configured color so option text remains aligned.
- [x] 2.5 Render the same color indicator before the selected real category in the trigger when it has a configured color.
- [x] 2.6 Reserve the same leading swatch space for a selected real category without a configured color so selected text remains aligned.
- [x] 2.7 Keep `Uncategorized` without a visible color indicator while reserving the same leading swatch space and preserving nullable category selection through the component API.

## 3. Item Form Integration

- [x] 3.1 Replace the category `Select` in `frontend/src/lib/components/ItemForm.svelte` with `CategorySelect`.
- [x] 3.2 Preserve existing default category, stale default, submission, reset, duplicate-name, pointer, and keyboard behavior.

## 4. Component Showcase

- [x] 4.1 Add a `CategorySelect` section to `frontend/src/routes/components/+page.svelte` using the real component.
- [x] 4.2 Showcase colored categories, a colorless real category with aligned text, aligned `Uncategorized`, selected category ID display, representative usage, and public API guidance.

## 5. Verification

- [x] 5.1 Add `CategorySelect` component tests covering visible color indicators, reserved swatch spacing for colorless real categories and `Uncategorized`, selected category trigger display, no visible indicator for `Uncategorized`, duplicate names, and emitted values.
- [x] 5.2 Update `ItemForm` tests proving category selection still submits the category ID and filtering/keyboard selection still use category labels through `CategorySelect`.
- [x] 5.3 Update component showcase tests to cover the `CategorySelect` section.
- [x] 5.4 Run `cd frontend && bun run test -- --run` and `cd frontend && bun run check`.

## 6. Documentation

- [x] 6.1 Update shared component documentation for `CategorySelect` and for the optional advanced `Select` snippet API.
