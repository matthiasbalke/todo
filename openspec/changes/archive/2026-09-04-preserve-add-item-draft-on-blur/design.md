## Context

The list detail page renders the new-item `ItemForm` only while `showAddForm` is true. The form owns its field state internally, so calling `oncancel` on external focus loss hides and unmounts the form, which also discards title, notes, due date, category, assignees, and recurrence values.

The form already distinguishes internal focus movement from external focus movement, and it already resets new-item fields after successful submission. This change preserves the external focus-loss minimization behavior while moving new-item draft persistence outside the transient `ItemForm` instance.

## Goals / Non-Goals

**Goals:**
- Preserve new-item draft values when the add-item form minimizes because focus leaves the form.
- Rehydrate the add-item form with the preserved draft when the user opens it again on the same list page.
- Keep successful submission as a draft reset.
- Keep explicit Cancel as a discard action for the draft.
- Keep existing edit-item form behavior unchanged.

**Non-Goals:**
- Persist add-item drafts across page reloads, navigation away from the list page, browser restarts, or multiple devices.
- Change backend item APIs or item persistence.
- Change category, date picker, recurrence, or assignee contracts beyond their participation in draft preservation.

## Decisions

- Store the add-item draft in the list detail page, not inside `ItemForm`.
  - Rationale: the list page controls whether the add form is mounted. Keeping draft state at that level allows the form to unmount when minimized without losing data.
  - Alternative considered: keep the form mounted and visually collapse it. That would couple visual state to focus behavior and keep inactive controls in the DOM unless additional accessibility handling is added.

- Add an explicit draft value/change contract to `ItemForm` for new-item usage.
  - Rationale: the form already owns the field inputs and can report a structured draft whenever they change. The parent can pass that draft back when remounting.
  - Alternative considered: read DOM values before hiding the form. That would be brittle and would not cover non-text controls such as category, due date, assignees, and recurrence cleanly.

- Keep `oncancel` as the signal for both minimization and explicit cancel, but let the caller choose whether to discard the draft.
  - Rationale: the current form has a single cancel callback. Adding context to the callback lets the list page preserve on focus-loss minimization and discard on explicit Cancel without introducing hidden global state.
  - Alternative considered: add a separate `onminimize` callback. That is clearer semantically but requires a larger component API change than necessary for this small behavior.

- Reset the parent draft only after successful add submission.
  - Rationale: this preserves the current post-submit blank form behavior while avoiding data loss if submission fails.
  - Alternative considered: clear on submit attempt. That would lose the draft on validation, network, or server errors.

## Risks / Trade-offs

- Draft and default category can drift if the remembered default category changes while a draft is present -> preserve the user's explicit draft selection, but fall back to the effective default only when starting from an empty draft.
- `oncancel` context could be mishandled by other `ItemForm` callers -> make the context optional/backward-compatible or update all current callers in the same change.
- Field changes must cover Set-valued assignees without mutating shared references -> clone assigned user IDs when sending or applying draft state.
