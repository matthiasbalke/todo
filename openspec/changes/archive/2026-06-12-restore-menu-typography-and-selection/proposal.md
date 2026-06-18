## Why

The shared Button migration applies medium font weight to every button, making burger-menu actions and submenu options appear bold. This weakens the previous visual hierarchy and makes selected filter and sort entries difficult to distinguish from unselected entries.

## What Changes

- Restore regular font weight for ordinary burger-menu actions and submenu options.
- Preserve intentional emphasis for primary, destructive, loading, chip, and other controls that require it.
- Make selected filter, sort, due-date, assignment, and similar submenu entries visibly blue while unselected entries remain neutral.
- Ensure selection highlighting does not depend on bold font weight alone.
- Add regression tests for menu typography and selected versus unselected option styling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shared-component-adoption`: Shared Button menu consumers must preserve regular menu typography and clear color-based selected-state distinction.

## Impact

- Affects `Button.svelte` typography presentation and burger-menu consumers in the standard and grocery list routes, plus the app account menu where applicable.
- Requires focused Button and route tests and updates to shared component documentation/showcase.
- Does not change menu behavior, selected values, API calls, accessibility semantics, or backend code.
