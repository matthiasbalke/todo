## 1. Shared Primitive Readiness

- [x] 1.1 Add a checked-in native-control inventory fixture or helper that records the audited 5 selects, 14 text/email inputs, and 82 consumer buttons, plus approved unmatched native elements and primitive/showcase exclusions.
- [x] 1.2 Extend `Button.svelte` with the named intent and size presentations needed by primary, secondary, danger, ghost, bare, compact, icon, menu, chip, backdrop, and loading consumers while preserving current defaults.
- [x] 1.3 Expand Button unit tests for every new presentation, native attribute/event forwarding, submit behavior, loading prevention, disabled behavior, and accessible icon-only usage.
- [x] 1.4 Modernize `TextInput.svelte` to a bindable Svelte 5 API with unique IDs, consumer ID/class support, native text-input attribute/event forwarding, and focus-element access while preserving validation.
- [x] 1.5 Expand TextInput unit tests for multiple-instance IDs, binding, forwarded attributes/events, element focus access, validation, descriptions, and custom classes.
- [x] 1.6 Update `EmailInput.svelte` to forward the hardened TextInput surface and preserve required, custom validation, binding, events, IDs, classes, and focus access; add focused tests.
- [x] 1.7 Harden `Select.svelte` with unique trigger/listbox IDs and compact/container/trigger styling hooks while preserving value identity, labels, keyboard behavior, and defaults; add regression tests.
- [x] 1.8 Extend `EditableLabel.svelte` with the explicit cancel, styling, ID, event, and focus hooks required by account and list-title consumers while preserving automatic and explicit save behavior; add regression tests.

## 2. Select Consumer Migration

- [x] 2.1 Replace both native selects in `FilterBar.svelte` with shared Select instances using existing encoded filter values and visible labels.
- [x] 2.2 Replace the native sort-field select and direction button in `SortSelector.svelte` with shared Select and Button while preserving typed sort values and direction toggling.
- [x] 2.3 Replace existing-member and invitation role selects in `MembersDialog.svelte` with shared Select instances while preserving role updates and invitation state.
- [x] 2.4 Add or update focused tests for filter changes, sorting, role changes, invitation role selection, keyboard operation, and multiple Select ID uniqueness.

## 3. Authentication And Account Migration

- [x] 3.1 Replace authentication display-name and passkey-label inputs with TextInput, the authentication email input with EmailInput, and all authentication action buttons with Button.
- [x] 3.2 Preserve authentication form submission, required fields, OAuth/passkey actions, loading labels, disabled states, errors, and keyboard behavior in route tests.
- [x] 3.3 Replace account display-name and email editors with EditableLabel, preserving automatic versus explicit save, cancellation, API errors, focus handling, and saving state.
- [x] 3.4 Replace the account passkey-label input with TextInput and all account action, icon, destructive, cancel, and loading buttons with Button.
- [x] 3.5 Update account route tests for profile edits, email confirmation, passkey creation/deletion, session actions, loading prevention, and cancellation.

## 4. Form And Dialog Migration

- [x] 4.1 Replace ItemForm's title input and assignment/cancel/submit buttons with TextInput and Button while preserving autofocus, Enter submission, chip state, cancellation, and submit reset behavior.
- [x] 4.2 Replace ListForm's name input and cancel/submit buttons with TextInput and Button while preserving emoji extraction, autofocus, Enter submission, and edit/create labels.
- [x] 4.3 Replace the lists page's new-group input and its create/cancel and list/group action buttons with TextInput and Button while preserving layout and group workflows.
- [x] 4.4 Replace ListGroupSection's rename input and all disclosure, menu, save, cancel, rename, and delete buttons with TextInput and Button while preserving drag/drop, collapse, menu, keyboard, and error behavior.
- [x] 4.5 Replace CategoryConfigDialog's edit/add inputs and all backdrop, close, reorder, color, save, cancel, rename, delete, and add buttons with TextInput and Button while preserving atomic name/color editing and dialog behavior.
- [x] 4.6 Replace MembersDialog's invitation email input and all close, remove, and add actions with EmailInput and Button while preserving owner permissions, loading, errors, and dialog behavior.
- [x] 4.7 Add or update focused tests for ItemForm, ListForm, lists/group flows, category configuration, and member management after shared-control adoption.

## 5. Remaining Button Consumer Migration

- [x] 5.1 Replace native buttons in `CategoryGroup.svelte`, `GroceryCategorySection.svelte`, and `ItemCard.svelte` with Button while preserving disclosure, add, star, completion, edit, swipe-delete, and accessibility behavior.
- [x] 5.2 Replace native navigation and account-menu buttons in the app layout with Button while preserving menu toggling, navigation actions, responsive behavior, and accessible names.
- [x] 5.3 Replace native buttons and the inline title input in the list-detail page with Button and EditableLabel or TextInput as designed, preserving title save/cancel, item actions, grouping, sorting, dialogs, and empty states.
- [x] 5.4 Replace native buttons in the grocery-detail page with Button while preserving category/item actions, grouping, completion, and mobile interactions.
- [x] 5.5 Replace the item-detail page action button with Button while preserving navigation and item workflow behavior.
- [x] 5.6 Update focused component and route tests for cards, groups, app layout, list detail, grocery detail, and item detail.

## 6. Adoption Guard And Documentation

- [x] 6.1 Add a frontend source-inventory test or script that rejects consumer-level native buttons, selects, textareas, and replaceable text/email inputs while permitting audited unmatched links, forms, fieldset/legend groups, labels, semantic content/layout elements, lists, tables, SVG markup, unsupported input types, shared primitive internals, and the component showcase.
- [x] 6.2 Make inventory failures report file and line details and require a documented reason for any explicit exception.
- [x] 6.3 Update the shared component README and component showcase for the hardened Button, TextInput, EmailInput, Select, and EditableLabel APIs and migration guidance.
- [x] 6.4 Re-run the inventory and confirm all 5 selects, 14 text/email inputs, and 82 audited buttons have been migrated or explicitly justified.

## 7. Verification

- [x] 7.1 Run focused shared primitive unit tests.
- [x] 7.2 Run focused component and route tests for every migrated feature area.
- [x] 7.3 Run the complete frontend Vitest suite.
- [x] 7.4 Run the frontend Svelte type check.
- [x] 7.5 Run the frontend production build.
- [x] 7.6 Validate the `replace-native-elements-with-shared-components` OpenSpec change.
