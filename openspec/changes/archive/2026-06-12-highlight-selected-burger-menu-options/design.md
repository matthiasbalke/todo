## Context

The standard and grocery list burger menus already conditionally add `text-blue-600` to selected filter and sort-field buttons. However, `Button.svelte` also adds `text-inherit` for every bare button. Tailwind utility precedence is determined by generated CSS, not class-string order, so the variant color can override the consumer color and make selected and unselected rows look the same.

Enabled "Hide checked" currently renders a check mark but keeps the same neutral text class as its disabled state. The selected blue is also hard-coded in duplicated route markup rather than represented as a semantic theme color.

## Goals / Non-Goals

**Goals:**
- Make selected filter and sort-field labels visibly blue.
- Make their check marks blue through the same selected-row color.
- Make enabled "Hide checked" label and check mark blue while keeping its disabled state neutral.
- Define the selected-menu blue centrally so it can be themed later.
- Preserve consistent behavior in standard and grocery list menus.

**Non-Goals:**
- Change filter, sorting, or hide-checked behavior or persistence.
- Change menu spacing, typography, labels, hover backgrounds, or accessibility semantics.
- Highlight the sort-direction action, which is an action rather than a checked option.
- Apply the new semantic color to unrelated controls.

## Decisions

### Remove the bare variant's conflicting explicit text utility

Remove `text-inherit` from the bare Button variant. Bare buttons will continue to inherit surrounding text color through normal button/preflight behavior, while consumer-provided text utilities can reliably define an explicit color.

This is preferred over adding Tailwind's important modifier at each call site because that would preserve the underlying conflict and spread precedence workarounds through consumers. It is also preferred over adding a menu-specific selected prop to Button because selection state and semantics remain owned by the route.

### Define a semantic selected-menu color

Define a global Tailwind theme color such as `--color-menu-selected`, initially using the blue-600 value, and consume it through `text-menu-selected`.

This provides one theming point and makes the intent clearer than repeating a palette-specific `text-blue-600` utility. Unselected rows keep their existing neutral gray utilities.

### Color the complete selected row

Apply the semantic selected color to the selected Button rather than separately styling its label and check-mark spans. Both descendants inherit the button's color, ensuring that selected text and check marks stay synchronized.

The condition applies to:
- The selected starred filter value.
- The selected due-date filter value.
- The selected assignee filter value in the standard list.
- The selected sort field.
- "Hide checked" only while it is enabled.

### Test effective styling and state transitions

Shared Button coverage will verify that a bare button can receive an explicit semantic text color without retaining the conflicting `text-inherit` utility. Route tests will assert selected versus neutral classes and verify hide-checked before and after toggling in both list variants.

## Risks / Trade-offs

- [Removing `text-inherit` changes an existing bare button] → Audit bare Button consumers and rely on existing inherited text behavior; run the full frontend suite and build.
- [A check mark receives a separate neutral class later] → Keep check marks unstyled so they inherit the selected row color and assert this behavior in route tests.
- [One duplicated menu remains inconsistent] → Update and test both standard and grocery routes.
- [The semantic utility is not generated] → Define it using Tailwind 4 theme variables and verify with the production build.
