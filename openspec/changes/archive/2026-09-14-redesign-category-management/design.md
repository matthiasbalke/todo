## Context

`CategoryConfigDialog.svelte` currently owns category ordering, creation, deletion, rename, and color editing. It uses fixed preset swatches, an edit mode with explicit save/cancel icon buttons, and only renders a leading color dot when a row has a configured color. `EditableLabel` already provides the desired automatic inline name editing behavior elsewhere in the app.

The category API and store already persist `color: string | null`, so this change can stay in the frontend dialog and component tests.

## Goals / Non-Goals

**Goals:**

- Keep category management in one dialog while making row editing lighter and more consistent.
- Use a stable leading color-control column for every category row.
- Let the row color control open color editing for existing categories.
- Support preset colors, clearing a color, and custom hex input for both existing and new categories.
- Preserve existing drag-and-drop ordering, delete behavior, and backend persistence contracts.

**Non-Goals:**

- Change the category API, database schema, SSE payloads, or authorization rules.
- Add a full color design system or named palette management.
- Change category selection in item forms or `CategorySelect`.

## Decisions

### Use the row color control as the color edit entry point

Each row should always render a fixed-size color control before the category name. For colored categories it shows the current color; for colorless categories it shows an empty state with the same dimensions. Activating it opens the color editor for that category.

Alternative considered: keep color editing behind the row name edit mode. That leaves the issue's open question unresolved in the UI and keeps color discovery tied to renaming.

### Reuse automatic inline name editing semantics

Category names should edit like `EditableLabel` automatic mode: enter inline edit from the displayed label, persist valid changes on commit/blur/Enter, and cancel with Escape. Separate save/discard buttons should be removed from the row editing flow.

Alternative considered: keep a bespoke edit state for name and color together. That preserves current complexity and makes color changes feel coupled to renaming.

### Create a small category color picker surface

The dialog should expose a compact picker that offers basic swatches, a clear/no-color action, and a hex text input. The same picker behavior should be usable for the add-new form and existing row color editing. Implementing this as a small `CategoryColorPicker` helper around the existing `ColorSwatchButton` keeps swatch presentation intact while giving the picker ownership of validation, normalization, clearing, and custom input.

Hex validation should accept standard `#RGB` and `#RRGGBB` values, normalize persisted custom colors to uppercase `#RRGGBB`, and reject invalid input before calling category persistence.

Alternative considered: rely only on `<input type="color">`. It supports arbitrary colors but does not naturally express the app's preset palette or no-color state.

### Commit color selections without save/discard buttons

Preset swatch selection and clearing should apply immediately for existing categories because those actions are explicit, single-value choices. Custom hex edits should stay local while invalid or incomplete, then persist when the user commits the hex field with Enter or blur and the value is valid. New categories should hold the selected color as draft state until the category is created.

Alternative considered: require users to explicitly apply every color change from the picker. That conflicts with the no-save/discard direction and makes color changes feel heavier than name edits.

## Risks / Trade-offs

- [Automatic name save may persist intermediate mistakes] -> Keep Escape cancellation before commit and validate empty names before calling persistence.
- [Immediate color swatch selection can persist a wrong click] -> Keep the color control easy to reopen and include a clear action so correction is one more explicit choice.
- [A popover inside a draggable row could interfere with drag gestures] -> Limit dragging to the existing drag handle and keep color controls ordinary buttons outside the handle.
- [Custom hex entry can create inconsistent color casing] -> Normalize accepted values before persistence.
- [The dialog can become crowded on small screens] -> Keep the picker compact, avoid nested cards, and verify mobile layout with focused tests or screenshots during implementation.

## Migration Plan

No data migration is required. Rollback is a frontend-only revert because the existing category color contract remains unchanged.
