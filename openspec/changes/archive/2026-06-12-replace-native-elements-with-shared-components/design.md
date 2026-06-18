## Context

The frontend component library contains `Button`, `TextInput`, `EmailInput`, `EditableLabel`, `Select`, `Textarea`, and `DatePicker`. `ItemForm` already demonstrates successful adoption of Select, Textarea, and DatePicker, but most production screens still render native controls directly.

The June 10, 2026 audit found the following replaceable consumer-level elements:

- 5 native selects: two in `FilterBar`, one in `SortSelector`, and two in `MembersDialog`.
- 14 native text/email inputs: three in authentication, three in account settings, two in category configuration, and one each in `MembersDialog`, `ItemForm`, `ListForm`, `ListGroupSection`, the lists page, and the list-detail page.
- 82 native buttons across `CategoryConfigDialog`, `CategoryGroup`, `GroceryCategorySection`, `ItemCard`, `ItemForm`, `ListForm`, `ListGroupSection`, `MembersDialog`, `SortSelector`, app layout, authentication, account settings, lists, list detail, grocery detail, and item detail.
- No consumer-level native textarea or date input remains.

Native elements inside the shared components are implementation details and are excluded. The development `/components` showcase is also excluded because it documents and exercises the primitives themselves.

Current shared APIs do not cover every production need cleanly. `TextInput` and `EmailInput` use legacy component events, fixed IDs, and limited attribute forwarding. `Select` uses fixed IDs and fixed trigger sizing. `Button` supports form actions well but lacks named compact, ghost, icon, menu, chip, and visually bare presentations. `EditableLabel` covers basic automatic or explicit save but not every existing cancel/focus pattern.

## Goals / Non-Goals

**Goals:**
- Replace every audited consumer-level native button, selectable list, and text/email input for which a shared component exists.
- Preserve business behavior, form submission, focus management, keyboard interaction, loading and disabled states, accessible names, and responsive layout.
- Strengthen shared APIs only where demonstrated consumer requirements need it.
- Consolidate inline text editing onto `EditableLabel` when the interaction matches, and use `TextInput` when editing is part of a larger composite editor.
- Add automated protection against new replaceable native controls outside approved primitive internals.
- Keep the migration reviewable and testable in feature-oriented batches.

**Non-Goals:**
- Replace the 11 production navigation anchors (`<a>`); there is no shared Link component, and native links retain correct navigation semantics.
- Replace the 4 production forms (`<form>`); there is no shared Form component, and native form submission semantics remain required.
- Replace ItemForm's `<fieldset>` and `<legend>` assignment grouping; there is no shared field-group component, and these elements provide the correct accessible relationship.
- Replace standalone semantic labels when a native label remains appropriate; there is no shared Label component. Labels owned by TextInput, EmailInput, Select, Textarea, DatePicker, or EditableLabel move into those components as part of control adoption.
- Replace semantic layout and content elements without shared counterparts, including headings, paragraphs, `div`, `span`, `section`, `header`, `main`, `footer`, lists, list items, tables, and SVG markup.
- Introduce shared components for links, forms, field groups, labels, layout, lists, tables, icons, checkboxes, radios, file inputs, or other input types as part of this change.
- Replace checkboxes, radios, file inputs, number inputs, search inputs, password inputs, range inputs, or similar controls. None currently appears as a production native control needing migration, and no corresponding shared component exists.
- Remove the native elements used internally by shared components.
- Redesign screens or change business workflows.
- Add a third-party component library or new dependency.
- Force `EditableLabel` into composite editors where category color selection or other adjacent state must be committed atomically.

## Decisions

### Harden shared primitives before migrating consumers

`Button` will gain explicit presentations and sizes needed by current consumers instead of requiring every call site to override its base styling. The supported surface will distinguish semantic intent from geometry: intent variants such as primary, secondary, danger, ghost, and bare; sizes such as default, small, and icon. Existing defaults remain unchanged.

`TextInput` will be updated to the current Svelte prop model with a bindable value, unique generated IDs, consumer-provided ID/class support, native text-input attribute and event forwarding, and a bindable element reference or focus method. `EmailInput` will forward the same surface while retaining email validation.

`Select` will gain unique trigger/listbox IDs and compact styling hooks required by filters and member-role controls. Its option identity, label resolver, keyboard behavior, and selection callback remain unchanged.

`EditableLabel` will gain the styling and explicit-cancel/focus hooks needed for account fields and list-title editing. Composite category and group editors will use `TextInput` because they coordinate additional controls or menu state.

Broad class-only overrides were rejected because Tailwind ordering would make shared defaults difficult to override reliably. Duplicating specialized wrappers for every screen was rejected because it would preserve the same fragmentation under new names.

### Migrate controls according to interaction semantics

Select replacements:
- `FilterBar`: starred and due-date filters use encoded string options with label resolvers.
- `SortSelector`: sort fields use their existing typed values and labels; direction uses Button.
- `MembersDialog`: member-role and invite-role controls use typed role options.

Input replacements:
- `EmailInput`: authentication email and member invitation email.
- `EditableLabel`: account display name, account email, and list title where display-to-edit behavior already exists.
- `TextInput`: authentication display/passkey labels, ItemForm title, ListForm name, new group name, list-group rename, category edit/add fields, and account passkey label.

Button replacements will preserve the existing semantic groups:
- Primary and submit actions.
- Secondary and cancel actions.
- Destructive actions.
- Loading actions using `loading` and `loadingLabel`.
- Compact icon, menu, disclosure, chip, and toolbar actions.
- Bare structural actions such as dialog backdrops while retaining accessible labeling or presentation semantics.

### Migrate in feature batches

The implementation order is:

1. Shared primitive API and unit-test upgrades.
2. Select consumers.
3. Authentication and account inputs/actions.
4. List, group, item-form, category, and member inputs/actions.
5. Navigation, cards, list-detail, grocery, and remaining button-only consumers.
6. Full regression checks and native-control inventory enforcement.

Each batch updates existing focused tests before proceeding. This limits debugging scope and prevents a broad migration from hiding behavior regressions.

### Enforce the adoption boundary automatically

Add a focused source-inventory test or script that scans production `.svelte` consumers for native `button`, `select`, `textarea`, and replaceable text/email `input` tags. It will allow only:

- Native internals in the corresponding shared primitive files.
- Native elements without shared equivalents: anchors, forms, fieldset/legend groups, labels, semantic layout/content elements, lists, tables, and SVG markup.
- Native input types without a shared equivalent, including checkbox, radio, file, number, search, password, and range.
- Explicitly documented exceptions, if a concrete blocker is discovered during implementation.
- The development component showcase.

The guard will report file and line information so violations are actionable. A simple source scan is sufficient because the repository uses direct Svelte markup and the rule concerns source ownership, not rendered DOM.

## Risks / Trade-offs

- [Large behavioral blast radius from 101 control replacements] → Migrate by component and feature batch, keep commits and tasks scoped, and run focused tests after each batch.
- [Shared defaults change layout or visual hierarchy] → Add named variants, sizes, and styling hooks before migration and assert critical classes/layout in existing tests.
- [Focus behavior regresses in auto-focused and inline-edit flows] → Forward element references and focus/blur/keydown handlers, then retain focused interaction tests.
- [Multiple shared controls collide through fixed IDs] → Generate unique IDs by default and preserve explicit IDs where forms depend on them.
- [Select popovers interact with dialog or form focus handling] → Add pointer, keyboard, Escape, and cancellation tests in filters and member dialogs.
- [A native button has highly specialized presentation] → Use the shared Button's bare or icon presentation while preserving semantic attributes; document an exception only if the wrapper cannot preserve behavior.
- [The inventory guard produces false positives] → Scope it to production Svelte consumers and maintain a small explicit allowlist with reasons.

## Migration Plan

1. Record the audited inventory in tests and confirm the baseline counts.
2. Upgrade shared primitives without changing existing default behavior.
3. Migrate selects and inputs, then verify component and route tests.
4. Migrate buttons in feature batches, preserving semantic intent and loading states.
5. Enable the inventory guard only after the audited consumers are migrated.
6. Run all frontend tests, Svelte type checking, production build, and OpenSpec validation.

Rollback is file-local: revert the affected consumer batch while retaining backward-compatible primitive enhancements. No data migration or deployment sequencing is required.

## Open Questions

None. Any native control that cannot be migrated without changing behavior must be documented as an explicit exception before the inventory guard is finalized.
