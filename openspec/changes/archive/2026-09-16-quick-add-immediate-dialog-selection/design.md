## Context

See `proposal.md` for motivation. The current quick-add composer keeps top-level draft state for title and details, then copies those values into dialog-local state when a detail dialog opens. The dialog footer always shows Cancel and Save, and only Save copies dialog-local values back into the pending quick-add draft.

The new behavior treats selection as the commit. Single-selection dialogs close as soon as a value is chosen. Multi-select dialogs apply changes as the user edits the set and keep the dialog open so multiple changes are possible. Closing or outside dismissal is only a dismissal affordance, not an undo mechanism. Notes remain explicitly saved because text input often benefits from an edit buffer.

The frontend already has several dialog-like surfaces implemented directly in feature components, including quick-add details, category configuration, member management, delete confirmations, date picker calendars, and fullscreen notes. This change should introduce a shared dialog shell for quick-add instead of baking another one-off modal behavior into `QuickAddItemForm.svelte`.

## Goals / Non-Goals

**Goals:**

- Make category, due date, recurrence, and assignee quick-add dialogs commit selection changes immediately.
- Close category, due date, and recurrence dialogs immediately after a value is selected.
- Remove dialog-footer Cancel actions; use the title-bar close affordance and outside dismissal for backing out before making a selection.
- Keep notes on an explicit Save model with title-bar close dismissal.
- Extract a reusable dialog shell for modal structure, labeling, title-bar close, Escape handling, outside dismissal, focus return, and common surface styling.
- Add the shared dialog shell to the components showcase so its default structure, close behavior, outside dismissal, and optional footer/action area can be reviewed independently of quick-add.
- Preserve focus return, focus-out draft preservation, and quick-add submission behavior.

**Non-Goals:**

- Changing backend item creation APIs or stored item shape.
- Changing the regular edit-item form behavior.
- Redesigning the shared Select, DatePicker, CategorySelect, or MultiSelect components beyond any small integration hooks needed by quick-add.
- Migrating every existing dialog in the app as part of this change.

## Decisions

1. Treat selection as commit rather than staging.

   Category, due date, recurrence, and assignee controls update the top-level quick-add draft as they change. There is no dialog-local selection buffer and no cancel/revert path after a selection has been made. For single-value controls, selecting a value also closes the dialog. For assignees, the dialog remains open because the user may select or remove multiple values in one visit.

   Alternative considered: keep a dialog-opening snapshot and restore it on cancel. That preserves a stronger undo story, but it conflicts with the desired mental model that choosing a value uses it immediately and makes multi-select editing feel like a reversible transaction rather than direct manipulation.

2. Use dismissal only for no-change exits.

   The title-bar close button, Escape, and outside click/touch close the dialog without applying any untouched single-selection value. For assignees, any changes already made are kept because they were direct edits to the selected set. Users can reverse assignee choices inside the multi-select, or clear applied quick-add values from the chip remove control in the quick-add bar.

   Alternative considered: keep a visible Cancel button in the footer. The title bar already has a close affordance, and a footer Cancel suggests changes can be undone after selection, which is no longer true.

3. Keep notes explicitly buffered.

   Notes continue to use dialog-local text plus Save because typing is incremental and accidental outside dismissal should not apply partially typed text. The title-bar close button, Escape, and outside click/touch discard unsaved note text.

   Alternative considered: autosave notes on input. That would broaden the requested change and make cancellation semantics less predictable for longer text.

4. Implement outside dismissal on the overlay without treating dialog-internal pointer activity as outside.

   The overlay should listen for pointer/click activation where the event target is outside the dialog surface and route that to the same close path as the title-bar close button. This must not trigger the list page focus-out cancellation that minimizes or clears the quick-add composer.

   Alternative considered: rely only on focusout. Pointer dismissal is explicitly required and focusout alone is brittle with popovers inside the dialog.

5. Extract a shared dialog shell and migrate quick-add detail dialogs onto it first.

   The shared shell should own the modal wrapper, `role="dialog"`, `aria-modal`, title labeling, title-bar close button, Escape handling, outside dismissal, focus return callback, and common overlay/surface styling. Consumers should provide the title, body content, and optional footer/actions. Quick-add can then focus on detail-specific state and selection behavior.

   Alternative considered: update the inline quick-add dialog markup only. That would be faster for this one change, but it would leave the same close/outside/focus behavior duplicated across the app and make future dialog consistency harder.

6. Showcase the shared dialog component.

   Add a component showcase example for the dialog shell that demonstrates opening the dialog, title-bar close, outside dismissal, Escape dismissal, body content, and an optional footer/action area. Keep showcase copy minimal and use the existing component showcase patterns for navigation and interactive examples.

   Alternative considered: rely on quick-add behavior tests only. Tests prove behavior, but the showcase helps inspect spacing, title treatment, overlay behavior, and action layout while the component is still small.

## Risks / Trade-offs

- Accidental single-value selection is harder to undo inside the dialog -> The dialog closes immediately and the quick-add chip remove control provides the visible reset path.
- Multi-select changes are no longer cancelable as a batch -> The multi-select must make selected options visually obvious and toggling them off must remain easy.
- Single-value picker close semantics may vary by component -> Tests should assert both the applied draft and dialog closure after selection.
- Outside-click handling can interfere with nested popovers such as date grids or select lists -> Treat elements rendered as part of the dialog interaction as inside the dialog, and cover date/select interactions in component tests.
- Immediate draft updates can trigger `onDraftChange` more often -> This is acceptable because draft preservation already listens to value changes; tests should cover that applied selections are preserved when the dialog closes.
- Shared dialog extraction can accidentally change unrelated dialog behavior if applied too broadly -> Migrate only quick-add detail dialogs in this change, and leave broader adoption for a later focused change.
- Showcase examples can drift from production usage -> Keep the example close to the shell API and cover only generic dialog structure, not quick-add-specific flows.
