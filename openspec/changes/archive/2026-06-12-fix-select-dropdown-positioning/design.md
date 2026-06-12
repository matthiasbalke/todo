## Context

Select currently measures its trigger with `getBoundingClientRect()` and renders the listbox as a fixed-position sibling using viewport `top`, `left`, and `width` values. This works when no ancestor establishes a fixed-position containing block.

MembersDialog uses `transform: translateY(-50%)` to center the dialog. CSS transforms establish a containing block for fixed descendants, so Select's viewport coordinates are interpreted relative to the transformed dialog. Both the existing-member role Select and invitation role Select therefore render their options far away from their triggers.

The fix must preserve Select's shared API, semantic Button composition, listbox accessibility, keyboard navigation, form focus behavior, and outside-click dismissal.

## Goals / Non-Goals

**Goals:**

- Position every Select listbox directly below and at the width of its trigger.
- Work consistently inside transformed dialogs and ordinary page/form layouts.
- Keep listbox pointer and focus interaction within the Select and its containing form or dialog.
- Remove coordinate state and measurement that are unnecessary for trigger-relative placement.
- Add regression tests for the shared primitive and MembersDialog.

**Non-Goals:**

- Add collision detection, automatic upward opening, viewport edge shifting, or a general popover framework.
- Redesign Select visuals, values, labels, keyboard controls, or validation.
- Change MembersDialog centering or member-management workflows.
- Introduce a positioning dependency.

## Decisions

### Position the listbox inside a trigger-relative wrapper

Select will place its Button trigger and conditional listbox inside a wrapper with `position: relative`. The listbox will use absolute positioning with `top: 100%`, `left: 0`, and full trigger-wrapper width, plus its existing high stacking order.

This uses one local coordinate system for the trigger and listbox, so transformed ancestors do not alter their relationship. The wrapper will cover only the trigger, not the label or validation message, ensuring the listbox starts directly below the trigger.

Keeping the listbox inside the Select container also means the existing outside-click check continues to treat option clicks as internal interaction. ItemForm focus-out behavior remains internal because the listbox stays in the form subtree.

### Remove viewport measurement state

`triggerElement`, `dropdownPosition`, and `updateDropdownPosition()` are only required by fixed viewport placement and will be removed unless trigger focus restoration still requires the element reference. If the trigger reference remains necessary for Escape focus restoration, it will be retained solely for that behavior.

The listbox will no longer use an inline positioning style. Width and placement become component-owned classes, consistent with the semantic styling policy.

### Keep MembersDialog free of positioning workarounds

MembersDialog will continue using the shared Select without offsets, portal targets, or dialog-specific classes. Regression tests will render the dialog, open both role selectors, and assert that each listbox belongs to the corresponding trigger-local positioning wrapper.

A body portal was rejected because it would require scroll and resize synchronization, explicit viewport collision behavior, and special handling to keep form/dialog focus and outside-click contracts intact. CSS anchor positioning was rejected because the project does not currently depend on its browser support.

## Risks / Trade-offs

- [An overflow-clipping ancestor could clip an absolute listbox] → Verify all current Select consumers; none place Select inside an overflow-clipping container. Treat future collision or portal requirements as a separate popover capability.
- [Changing DOM nesting could affect outside-click or form cancellation behavior] → Retain the listbox inside the Select container and run Select and ItemForm interaction regressions.
- [Multiple Select instances could associate tests with the wrong listbox] → Preserve unique trigger/listbox IDs and `aria-controls`, and use those associations in MembersDialog tests.
- [The listbox could render below validation text instead of below the trigger] → Scope the relative wrapper to the trigger and listbox only, leaving validation content outside it.

## Migration Plan

1. Add failing positioning tests for Select inside a transformed ancestor and for both MembersDialog role controls.
2. Replace fixed viewport positioning with the trigger-local relative/absolute structure.
3. Remove obsolete measurement state and inline positioning.
4. Run Select, MembersDialog, ItemForm, semantic styling guard, and full frontend verification.

Rollback is limited to restoring the previous Select positioning implementation; no data or API migration is required.

## Open Questions

None. Advanced viewport collision handling remains explicitly outside this change.
