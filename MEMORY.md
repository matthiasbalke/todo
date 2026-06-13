## ItemForm due-date picker

- `ItemForm.svelte` uses the shared `DatePicker` with nullable `string | null` state throughout initialization, submission, and new-item reset.
- ItemForm no longer needs native picker blur workarounds; date, category, and recurrence use shared components with form-internal interaction coverage.
- Integration coverage lives in `ItemForm.test.ts` and verifies existing values, selection, clearing, submission/reset, and new-form focus/cancel behavior.

## ItemForm category select

- `ItemForm.svelte` uses the shared `Select` with category IDs as option values and category names as display labels; the empty string displays as `Uncategorized` and submits as `null`.
- `Select.svelte` supports an optional `getOptionLabel` resolver while preserving primitive option rendering and original option values in `onSelect`.
- Category integration coverage verifies defaults, stale IDs, duplicate names, submission/reset, keyboard interaction, and new-form focus/cancel behavior.

## ItemForm recurrence select

- `ItemForm.svelte` uses the shared `Select` with encoded recurrence presets as option values and the existing recurrence text as display labels.
- Existing rule initialization, unsupported-rule fallback to no recurrence, nullable submission, and new-item reset behavior remain unchanged.
- Recurrence integration coverage verifies all presets, pointer and keyboard selection, Escape dismissal, and new-form focus/cancel behavior.

## Textarea component

- `Textarea.svelte` is the shared multiline primitive with bindable string values, unique accessible IDs, descriptions, synchronous validation, native textarea prop/event forwarding, and configurable rows/resize behavior.
- `ItemForm.svelte` uses Textarea for notes with two rows and resizing disabled while preserving empty-string-to-null submission.
- The development `/components` route documents and demonstrates Textarea; its production redirect remains in `frontend/src/routes/components/+page.ts`.

## Shared component adoption

- Production Svelte consumers now use shared `Button`, `TextInput`, `EmailInput`, `Select`, and `EditableLabel` controls for the audited 5 selects, 14 text/email inputs, and 82 buttons.
- `Button` supports primary, secondary, danger, ghost, and bare intents plus default, small, compact, icon, menu, chip, and backdrop sizes.
- `TextInput` and `EmailInput` use bindable Svelte 5 props, unique IDs, native attribute/event forwarding, descriptions, styling hooks, and bindable element references.
- `Select` and `EditableLabel` generate unique IDs; Select supports compact styling hooks, while EditableLabel supports explicit cancellation, styling hooks, and bindable focus access.
- `nativeControlInventory.test.ts` enforces the production adoption boundary and requires documented path/line/reason metadata for any future exception.
- Verification completed with 314 Vitest tests, clean `svelte-check`, a successful production build, and a valid OpenSpec change.

## Shared Button alignment

- `Button.svelte` exposes `align="center" | "start" | "between"` and keeps centered content as the default.
- Grocery rows use start alignment, while grocery category headers use space-between alignment.
- Standard list category headers use space-between alignment so category and uncategorized labels begin at the left edge while disclosure indicators remain at the right edge.
- App account-menu actions and standard/grocery list menu actions explicitly use start or space-between alignment according to their content.
- Alignment regressions are covered by Button, grocery component, category-group, app-layout, standard-list, and grocery-list tests.

## Shared Button menu typography

- `Button.svelte` exposes `weight="normal" | "medium"` and retains medium as the default for existing consumers.
- Account, standard-list, and grocery-list menu rows explicitly use normal weight; non-interactive menu section headings retain medium weight.
- Selected filter and sort options use blue text plus the existing checkmark, while unselected options remain neutral gray; both states use normal weight.
- Typography and selection regressions are covered by Button, app-layout, standard-list, grocery-list, and component-showcase tests.
- Verification completed with 324 Vitest tests, clean `svelte-check`, and a successful production build.

## Burger menu selected colors

- Bare shared Buttons no longer emit `text-inherit`, allowing consumer text-color utilities to take effect reliably.
- Standard and grocery list menus use `text-menu-selected` for checked filter and sort-field rows and enabled `Hide checked`; check marks inherit the same blue color.
- Verification completed with 327 Vitest tests, clean `svelte-check`, and a successful production build.

## Grocery mode menu action

- The standard list burger menu renders `Grocery mode` through the shared bare Button with start alignment and normal weight.
- Activation closes the menu and uses SvelteKit `goto` to navigate to `/lists/{id}/grocery`.
- Route coverage verifies button semantics, shared menu styling, navigation, and menu dismissal.
- Verification completed with 328 Vitest tests, clean `svelte-check`, and a successful production build.

## Semantic shared-component styling proposals

- `standardize-semantic-component-styling` proposes separate Button tone and appearance APIs, named presentation props for other shared controls, primitive composition inside composite controls, and an automated guard that permits only parent-layout classes at consumer call sites.
- The June 12, 2026 audit found 84 production Button usages, including 66 explicit `bare` usages; `ghost` was unused outside the showcase, and multiple consumers reconstructed primary, danger, menu, icon, and selected-state styling with Tailwind utilities.
- `extract-specialized-interaction-controls` is a dependent follow-up for calendar day cells, category color swatches, item completion and star toggles, and swipe-delete actions.
- Specialized controls remain exact documented guard exceptions only until the follow-up is implemented; its completion criterion is an empty specialized-exception list.

## Semantic shared-component styling implementation

- `Button.svelte` now separates `tone` (`primary`, `neutral`, `danger`, `success`) from `appearance` (`solid`, `outline`, `soft`, `ghost`, `bare`) and owns selected, active, invalid, emphasis, alignment, weight, loading, and named geometry.
- `Select` composes Button for its trigger/options, `EditableLabel` composes TextInput and Button, and `DatePicker` composes Button for its standard actions.
- TextInput, Textarea, Select, and EditableLabel use named size/appearance props; legacy `variant`, `triggerClass`, `inputClass`, `displayClass`, and `labelClass` APIs are removed.
- `sharedComponentStyling.test.ts` permits only parent-layout classes on shared controls and rejects visual/custom classes, inline styles, removed hooks, and invalid exceptions with source diagnostics.
- The remaining exact exceptions match `extract-specialized-interaction-controls`: calendar day, two color swatches, completion toggle, star toggle, and swipe-delete action.
- `extract-specialized-interaction-controls` now provides CalendarDayButton, ColorSwatchButton, CompletionToggle, StarToggle, and SwipeDeleteAction; DatePicker, CategoryConfigDialog, and ItemCard use them and the specialized styling exception list is empty.
- `fix-select-dropdown-positioning` replaces Select's fixed viewport coordinates with a trigger-local relative/absolute listbox, so transformed dialogs such as MembersDialog keep role options directly below their triggers.
- Verification completed with 371 Vitest tests, clean `svelte-check`, successful production build, and valid OpenSpec artifacts.

## OpenSpec archive consolidation

- On June 12, 2026, the 15 completed changes listed in `openspec-changes.txt` were synced to main specs and archived in list order under `openspec/changes/archive/2026-06-12-<change-name>/`.
- The ordered `shared-component-adoption` deltas required one manual merge because `fix-shared-button-left-alignment` modified the capability before `replace-native-elements-with-shared-components` introduced its baseline; the later typography delta then applied normally.
- `openspec validate --all` passed all 18 current specs and active changes after the archive operation.
- `highlight-selected-burger-menu-options` was subsequently synced to the new `burger-menu-selection-styling` main spec and archived as `2026-06-12-highlight-selected-burger-menu-options`; no active OpenSpec changes remain.

## Account E2E shared-component selectors

- The account display-name E2E test locates `EditableLabel` by accessible role and current-value name in both display and edit modes.
- `viewer-read-only-list-ui` adds the authenticated user's `ListRole` to list summary/detail responses and stores it on the frontend list model. UI policy is centralized in `frontend/src/lib/listCapabilities.ts`: owners can edit items/categories/list/members, editors can edit items/categories, and viewers receive read-only list, grocery, item-detail, and membership presentations while retaining local display controls, navigation, and personal list grouping.
- Avoid selectors for the removed `Edit` text and generic input-type selectors; the shared component exposes a stable button/textbox accessibility contract.

## TimezonePicker component

- `TimezonePicker.svelte` composes shared `Select` and exposes a bindable exact IANA identifier, disabled state, label/placeholder configuration, and `onSelect`.
- `timezonePicker.ts` builds options from `Intl.supportedValuesOf('timeZone')`, always includes `UTC`, and retains valid selected and browser-detected zones when enumeration is unavailable.
- Friendly labels are derived without changing values, for example `Europe/Berlin` displays as `Berlin (Europe)`.
- The development component showcase documents binding and API usage; verification passes all 421 frontend tests and clean `svelte-check`.
