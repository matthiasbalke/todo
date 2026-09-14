## Context

See `proposal.md` for motivation. The regular list page currently renders `ItemForm` inside `FixedActionFooter` for item creation, and `ItemForm` owns title, category, due date, recurrence, assignees, notes, done, starred, submit, cancel, draft, and focus-out behavior. Several field controls are already shared components: `CategorySelect`, `DatePicker`, `Select`, `MultiSelect`, `Textarea`, `Button`, and `Icon`.

The edit-item page still needs the full item form. This change should therefore avoid simplifying `ItemForm` in a way that weakens edit behavior or existing item form specs.

## Goals / Non-Goals

**Goals:**

- Provide a compact new-item composer optimized for fast title entry.
- Keep the existing add-item data contract, including nullable optional values and recurrence rule conversion.
- Reuse existing field controls so category colors, date picking, recurrence labels, assignee avatars, and notes editing remain consistent.
- Preserve the existing draft lifecycle for focus-out minimization, explicit cancellation, successful submit reset, and failed submit recovery.

**Non-Goals:**

- No backend, database, or API changes.
- No change to existing edit-item behavior.
- No change to item-card actions for completion or starring after creation.
- No new category, recurrence, or assignment data model.

## Decisions

### Build a dedicated quick-add component

Create a new quick-add component for list-page item creation instead of making `ItemForm` conditionally render two substantially different layouts.

Rationale: the quick-add flow has different interaction structure, with icon-triggered dialogs and Enter submission from the title input. Keeping it separate avoids making the edit form harder to reason about and reduces regression risk for existing item editing.

Alternative considered: add a `mode="quick-add"` prop to `ItemForm`. This would reuse state helpers directly, but it would mix two layout models and increase the chance that focus, draft, and notes-dialog changes affect edit workflows.

### Keep draft state in the quick-add component using the existing draft shape

Use the existing `ItemFormDraft` shape, or an equivalent compatible type, for title, notes, due date, category, assigned users, recurrence preset, done, and starred. The quick-add UI can default `done` and `starred` to false even though it does not expose those controls.

Rationale: the list page already stores and restores add-item drafts, and preserving the same shape keeps submission and reset semantics predictable.

Alternative considered: introduce a narrower quick-add draft type. That would be cleaner inside the component, but the list page would need translation logic and tests for two draft formats.

### Dialogs edit temporary values and commit explicitly

Each icon opens a detail dialog initialized from the current saved quick-add value. Dialog-local changes commit only on save and are discarded on cancel or dismissal.

Rationale: the issue asks for custom dialogs per icon while keeping already entered title text. Explicit commit behavior prevents accidental draft mutation while the user explores or backs out of a dialog.

Alternative considered: bind dialog fields directly to the pending draft. This is simpler, but cancel semantics become surprising unless every field has custom rollback code.

### Reuse existing controls inside dialogs

The category dialog should use `CategorySelect`; due date should use `DatePicker`; recurrence should use the shared `Select` with existing recurrence labels and conversion helpers; assignees should use `MultiSelect`; notes should use the existing multiline text area styling and can share the current fullscreen notes editor pattern if that remains the best mobile fit.

Rationale: shared controls already satisfy existing specs for labels, keyboard interaction, colors, avatars, nullable values, and recurrence presets.

Alternative considered: implement bespoke lightweight pickers for the quick-add dialogs. That would reduce markup per dialog but would duplicate accessibility and value conversion behavior.

## Risks / Trade-offs

- Focus-out cancellation can fire while opening dialogs -> Treat dialog pointer and focus transitions as internal quick-add interactions and cover this with list-page tests.
- Separate quick-add and edit-form code can duplicate recurrence and submit mapping -> Extract small shared helpers only where duplication becomes meaningful during implementation.
- Bottom-fixed dialog and footer layers may compete on mobile -> Use one modal layer above the footer, trap focus, and verify mobile layout with existing component/list tests or Playwright if needed.
- Icon-only controls can become unclear -> Give every icon button a stable accessible label and selected-value state where useful.

## Migration Plan

Implement as a frontend-only change. Replace the list page's add-item `ItemForm` usage with the quick-add component, keeping the same `handleAddItem`, draft persistence, default category, categories, and members inputs. Rollback is a frontend revert to the previous `ItemForm` rendering path; no persisted data migration is required.
