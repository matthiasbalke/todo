## 1. Shared Button Alignment

- [x] 1.1 Add a typed Button content-alignment prop with center, start, and between presentations while preserving center as the default.
- [x] 1.2 Extend Button unit tests to verify default center alignment, explicit start alignment, explicit space-between alignment, and compatibility with existing variants, sizes, and consumer classes.

## 2. Grocery Alignment

- [x] 2.1 Update `GroceryCategorySection.svelte` so category headers use space-between alignment and item rows use start alignment.
- [x] 2.2 Add focused grocery component or route tests confirming unchecked and checked item controls and labels begin at the left edge while category counts and disclosure indicators remain at the opposite edge.

## 3. Menu Alignment

- [x] 3.1 Audit full-width Button consumers in the app account menu and standard/grocery list burger menus and assign start or between alignment according to their content structure.
- [x] 3.2 Add focused layout and list-route tests confirming primary menu labels are left aligned and submenu status text or checkmarks remain right aligned.

## 4. Documentation And Verification

- [x] 4.1 Update the shared component README and development showcase with the Button alignment API and migration guidance for full-width rows and menus.
- [x] 4.2 Run focused Button, grocery, app-layout, standard-list, and grocery-list tests.
- [x] 4.3 Run the complete frontend Vitest suite, Svelte type check, and production build.
- [x] 4.4 Validate the `fix-shared-button-left-alignment` OpenSpec change.

## 5. Standard List Category Alignment

- [x] 5.1 Update `CategoryGroup.svelte` so category and uncategorized header buttons use space-between alignment, placing the label at the left edge and the disclosure indicator at the right edge.
- [x] 5.2 Add focused `CategoryGroup` regression tests covering named and uncategorized headers, expanded and collapsed disclosure states, alignment, and unchanged toggle behavior.

## 6. Follow-up Verification

- [x] 6.1 Run the focused `CategoryGroup` and standard list route tests.
- [x] 6.2 Run the complete frontend Vitest suite, Svelte type check, and production build.
- [x] 6.3 Validate the extended `fix-shared-button-left-alignment` OpenSpec change.
