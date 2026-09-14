## 1. Color Picker Behavior

- [x] 1.1 Add a `CategoryColorPicker` helper around `ColorSwatchButton` for preset swatches, clearing color, custom hex entry, validation, and normalization; verify with focused frontend unit tests for valid `#RGB`/`#RRGGBB`, invalid values, clear state, and emitted normalized values
- [x] 1.2 Integrate the color picker into the new-category footer with the existing category creation flow; verify tests cover creating with a preset color, normalized custom hex color, and no color

## 2. Existing Category Editing

- [x] 2.1 Replace explicit category rename save/cancel controls with automatic inline name editing behavior matching `EditableLabel`; verify tests cover commit on blur/Enter, Escape cancellation, empty-name rejection, and removal of save/discard buttons
- [x] 2.2 Add a fixed leading color control to every category row and use it to edit existing category colors; verify tests cover colored and colorless rows, immediate preset selection, immediate clearing, normalized custom hex commit on Enter/blur, and invalid custom color rejection
- [x] 2.3 Preserve drag handle, delete action, row reordering, and category persistence behavior after the editing changes; verify existing and updated category dialog tests still pass
- [x] 2.4 Add category delete confirmation naming the category and verify tests cover opening, canceling, and confirming deletion

## 3. Layout And Accessibility

- [x] 3.1 Align category names consistently regardless of color state; verify with component assertions or screenshots that colorless and colored category names share the same starting position
- [x] 3.2 Ensure the dialog remains usable on narrow viewports with stable tap targets and accessible names for color controls, inputs, delete, close, and drag handles; verify via frontend tests or Playwright/component screenshot coverage

## 4. Validation

- [x] 4.1 Run `cd frontend && bun run check` and verify Svelte type-checking succeeds
- [x] 4.2 Run the relevant frontend unit tests for `CategoryConfigDialog` and any new color-picker helper; verify they pass
- [x] 4.3 Run `openspec validate redesign-category-management --strict` and verify the change passes validation
