## 1. Audit And Policy Fixtures

- [x] 1.1 Add a checked-in inventory of shared-control consumers, current Button tone/appearance equivalents, legacy visual hook usages, and specialized-control exceptions.
- [x] 1.2 Define and unit test the layout-utility allowlist, forbidden visual utility families, state-prefixed utility handling, arbitrary-value handling, and actionable diagnostic format.

## 2. Semantic Button API

- [x] 2.1 Replace Button's combined variant API with typed tone and appearance props covering primary, neutral, danger, and success tones plus solid, outline, ghost, and bare appearances.
- [x] 2.2 Review Button geometry APIs and add named selected/menu/option behavior without requiring consumer padding, typography, radius, color, or hover classes.
- [x] 2.3 Encode or reject unsupported tone/appearance combinations and preserve native attributes, form types, loading, disabled behavior, alignment, and accessible icon usage.
- [x] 2.4 Expand Button tests for every supported tone/appearance/state/size combination and verify visual consumer classes are no longer required.

## 3. Other Primitive APIs And Composition

- [x] 3.1 Replace Select trigger visual hooks with named size/density/state props and compose Button for the trigger and standard option actions while preserving listbox behavior.
- [x] 3.2 Refactor EditableLabel to compose TextInput and Button for editing, display activation, save, and cancel while preserving automatic/explicit save, validation, focus, and cancellation.
- [x] 3.3 Refactor DatePicker to compose Button for its trigger, month navigation, Today, and Clear actions while retaining a documented temporary exception for calendar day cells.
- [x] 3.4 Replace TextInput, EmailInput, Textarea, and EditableLabel visual class hooks with named semantic or geometry props required by audited consumers.
- [x] 3.5 Add focused primitive tests for composed attribute forwarding, roles, keyboard interaction, focus return, disabled/loading behavior, validation, and style ownership.

## 4. Standard Consumer Migration

- [x] 4.1 Migrate authentication and account actions to semantic tone/appearance props, including filled confirmations, destructive text actions, cancel actions, and compact actions.
- [x] 4.2 Migrate list and group forms, dialogs, category actions, member actions, and item forms to semantic props and remove visual utility overrides.
- [x] 4.3 Migrate application, standard-list, and grocery-list menus and selected options to semantic menu/option states without consumer colors, hover styles, padding, or typography.
- [x] 4.4 Migrate remaining standard icon, disclosure, empty-state, add, edit, and delete actions while preserving layout-only classes.
- [x] 4.5 Migrate Select, EditableLabel, and other shared-control consumers from visual class hooks to named props.
- [x] 4.6 Update focused component and route tests for unchanged behavior and semantic configuration.

## 5. Automated Enforcement

- [x] 5.1 Add a source-level shared-component styling guard that reports forbidden utility overrides with file, line, component, prop, and utility.
- [x] 5.2 Make the guard reject legacy visual hook props, inline visual styles, broad exceptions, and undocumented exceptions.
- [x] 5.3 Add exact temporary exceptions for calendar days, color swatches, item completion/star toggles, and swipe-delete surfaces, each referencing `extract-specialized-interaction-controls`.
- [x] 5.4 Add guard fixtures covering allowed parent layout classes, rejected static and conditional visual utilities, responsive/state prefixes, arbitrary values, and invalid exceptions.
- [x] 5.5 Confirm all standard production shared-control consumers pass the guard without exceptions.

## 6. Remove Legacy APIs And Document

- [x] 6.1 Remove the old Button variant prop and completed compatibility mappings after all production consumers migrate.
- [x] 6.2 Remove unrestricted visual class props from shared controls while retaining only documented parent-layout hooks.
- [x] 6.3 Update the shared-component README and development showcase with tone, appearance, state, geometry, composition, and class-ownership guidance.

## 7. Verification

- [x] 7.1 Run focused Button, Select, EditableLabel, DatePicker, TextInput, EmailInput, and Textarea tests.
- [x] 7.2 Run focused authentication, account, form, dialog, list, grocery, menu, and item workflow tests.
- [x] 7.3 Run the complete frontend Vitest suite, Svelte type check, and production build.
- [x] 7.4 Validate the `standardize-semantic-component-styling` OpenSpec change and verify its exception inventory matches the specialized-controls follow-up scope.
