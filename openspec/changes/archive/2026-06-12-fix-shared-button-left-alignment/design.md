## Context

`Button.svelte` applies centered alignment by default. During the shared-control migration, grocery rows, standard list category headers, and menu actions retained `text-left`, `w-full`, and in some cases `justify-between`, but consumer utility classes do not replace the Button alignment presentation reliably. Controls without an explicit alignment prop therefore inherit `justify-center` and render their child content in the middle.

The affected controls already have the correct native semantics and feature behavior. The fix must restore layout without reverting shared Button adoption or relying on Tailwind class ordering to override a base utility.

## Goals / Non-Goals

**Goals:**
- Give Button consumers an explicit, typed way to select horizontal content alignment.
- Preserve centered alignment as the existing default for ordinary form and icon buttons.
- Restore left alignment for grocery item rows and menu/submenu actions.
- Restore left-edge category labels in the standard list view while preserving right-edge disclosure indicators.
- Preserve `space-between` layouts for disclosure and summary actions.
- Add focused regression tests that inspect the rendered flex alignment.

**Non-Goals:**
- Redesign grocery rows, menus, spacing, typography, or responsive breakpoints.
- Change button click handlers, keyboard behavior, disabled/loading behavior, or accessible names.
- Replace links used for navigation.
- Change alignment globally for all Button consumers.

## Decisions

### Add an explicit Button content-alignment prop

Button will expose a named alignment prop such as `align="center" | "start" | "between"` with `center` as the default. The component will map this value to stable flex justification classes.

This is preferred over consumer `justify-start` classes because the existing base `justify-center` remains in the same class string and utility resolution can be sensitive to generated CSS ordering. It is also preferred over changing the default to left alignment because most form, icon, and compact actions intentionally remain centered.

### Apply alignment according to control structure

- Grocery category headers use `between`.
- Grocery item rows use `start`.
- Standard list category headers use `between`, placing the category label at the left edge and disclosure indicator at the right edge.
- Full-width menu items with a single label use `start`.
- Menu headers that display a label and status summary use `between`.
- Submenu option rows that display a label and checkmark use `between`.

Existing `text-left` classes remain where they control multiline text alignment, but flex placement is owned by the Button API.

### Cover the primitive and representative consumers

Button unit tests will verify the default and each named alignment. Focused grocery, standard category-group, and list-menu tests will assert representative headers, rows, and submenu items use the intended alignment while retaining existing interaction behavior.

## Risks / Trade-offs

- [A consumer is missed and remains centered] → Audit all full-width bare/menu Button usages and cover representative menu structures in tests.
- [Category headers appear left aligned but the disclosure indicator moves beside the label] → Use `between` rather than `start` and assert both the alignment class and disclosure behavior.
- [A global default change causes unrelated layout regressions] → Keep `center` as the default and opt affected consumers into `start` or `between`.
- [Text alignment and flex alignment are conflated] → Retain `text-left` where needed and test the explicit flex justification separately.
- [Class assertions become brittle] → Assert the named alignment utility and user-visible structure rather than the complete class string.
