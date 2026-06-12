## Context

`Button.svelte` currently includes `font-medium` in its base class list. This is appropriate for primary form actions but is inherited by every `variant="bare"` menu action and submenu choice. Consumer attempts to use regular weight would conflict with the shared base utility and depend on Tailwind class ordering.

The list menus already assign blue text to selected options and neutral gray text to unselected options, but the universal medium weight makes nearly every row visually emphasized. The selected state therefore no longer has the clear hierarchy it had with native buttons.

## Goals / Non-Goals

**Goals:**
- Give Button an explicit, typed font-weight presentation.
- Keep existing medium weight as the default for backward compatibility.
- Render ordinary menu actions and all submenu options at regular font weight.
- Use blue text and the existing checkmark to distinguish selected submenu options.
- Keep unselected options neutral gray at regular weight.
- Add regression tests for primitive weight and route-level selected states.

**Non-Goals:**
- Redesign menu spacing, alignment, hover backgrounds, labels, or section headings.
- Remove checkmarks from selected entries.
- Change filter, sorting, assignment, hide-done, or navigation behavior.
- Apply regular font weight to all buttons globally.

## Decisions

### Add an explicit Button weight prop

Button will expose `weight="normal" | "medium"` with `medium` as the default. The component will map this value to `font-normal` or `font-medium` and remove the unconditional weight class from its base styles.

This is preferred over adding `font-normal` through consumer `class` strings because conflicting utility classes can resolve according to generated CSS order. It is preferred over making all bare buttons regular automatically because some bare controls intentionally use emphasized typography.

### Apply regular weight to menu rows

The app account menu and the standard/grocery list burger menus will use `weight="normal"` for:

- Primary menu actions.
- Filter and sort submenu headers.
- Selected and unselected submenu choices.
- Sort-direction, hide-checked, and destructive menu actions.

Menu section labels remain intentionally medium because they are non-interactive headings.

### Preserve selected state through color

Selected filter, due-date, assignment, and sort options will use blue text while unselected options remain gray. Both states use regular weight, so selection is conveyed by color and checkmark rather than boldness.

Focused tests will assert that selected entries have blue text and regular weight, while unselected entries have neutral text and regular weight.

## Risks / Trade-offs

- [A menu action remains bold because it is missed] → Audit all full-width burger-menu Button consumers and cover standard, grocery, and account menus.
- [Selected state still lacks contrast] → Assert selected blue and unselected neutral classes in route tests, not only the checkmark.
- [Default button typography changes unexpectedly] → Keep `medium` as the Button default and opt menu consumers into `normal`.
- [Consumer classes reintroduce conflicting font utilities] → Use the typed weight prop and remove redundant `font-medium` from selected-option class branches.
