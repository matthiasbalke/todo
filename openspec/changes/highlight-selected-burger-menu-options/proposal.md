## Why

Selected filter and sorting options currently carry a blue utility class, but the shared bare Button's inherited text color can override it, leaving selected labels and check marks visually identical to unselected options. Enabled "Hide checked" also lacks the selected blue treatment.

## What Changes

- Give shared Button consumers a reliable way to request selected blue text without conflicting with the bare variant's inherited color.
- Render selected filter options, selected sorting options, and enabled "Hide checked" with blue label text and blue check marks.
- Keep unselected menu options neutral and preserve existing menu behavior, typography, layout, and accessibility semantics.
- Apply and verify the behavior in both standard and grocery list burger menus.

## Capabilities

### New Capabilities

- `burger-menu-selection-styling`: Defines reliable blue text and check-mark presentation for selected filter, sorting, and hide-checked controls.

### Modified Capabilities

None.

## Impact

- Affects the shared frontend Button presentation API and standard/grocery list burger-menu consumers.
- Requires shared Button and route-level regression tests that verify effective selected-state color.
- Does not affect backend APIs, persisted preferences, dependencies, or menu interactions.
