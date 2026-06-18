## 1. Confirm Dependency And Exception Inventory

- [x] 1.1 Verify `standardize-semantic-component-styling` is implemented and record the exact calendar-day, color-swatch, completion-toggle, star-toggle, and swipe-delete exceptions.
- [x] 1.2 Confirm Button forwards the roles, ARIA attributes, tabindex, events, and element references required by the specialized controls; add only minimal generic forwarding support if needed.

## 2. Calendar Day Control

- [x] 2.1 Create CalendarDayButton with typed selected, current, adjacent, disabled, focused/tabindex, label, date value, click, keydown, and element-binding behavior.
- [x] 2.2 Add CalendarDayButton tests for gridcell semantics, selected/current states, disabled behavior, focus classes, native events, and element binding.
- [x] 2.3 Migrate DatePicker calendar cells to CalendarDayButton while preserving roving focus, keyboard navigation, range constraints, date selection, and focus return.
- [x] 2.4 Remove the calendar-day styling exception and run focused DatePicker tests.

## 3. Color Swatch Control

- [x] 3.1 Create ColorSwatchButton with typed color, selected state, accessible label, activation, and component-owned dynamic color styling.
- [x] 3.2 Add ColorSwatchButton tests for arbitrary supported colors, selected/unselected presentation, focus, activation, and accessible state.
- [x] 3.3 Migrate CategoryConfigDialog edit and add swatches while preserving select/deselect behavior, atomic edits, and persistence.
- [x] 3.4 Remove all color-swatch styling exceptions and run focused category dialog tests.

## 4. Item State Toggles

- [x] 4.1 Create CompletionToggle with typed done state, accessible state/action labeling, click/touch handling, and component-owned active/inactive presentation.
- [x] 4.2 Create StarToggle with typed starred state, accessible state/action labeling, click/touch handling, and component-owned active/inactive presentation.
- [x] 4.3 Add focused toggle tests for mouse and touch activation, event propagation, one-time callbacks, state semantics, and disabled behavior if supported.
- [x] 4.4 Migrate ItemCard completion and star actions while preserving optimistic store behavior, edit gestures, drag behavior, and accessible names.
- [x] 4.5 Remove completion-toggle and star-toggle styling exceptions and run focused ItemCard and list workflow tests.

## 5. Swipe Delete Action

- [x] 5.1 Create SwipeDeleteAction with destructive semantic styling, accessible labeling, activation, and the narrow width/height contract required by swipe orchestration.
- [x] 5.2 Add SwipeDeleteAction tests for presentation ownership, activation, accessible name, and gesture-owned geometry.
- [x] 5.3 Migrate ItemCard's revealed delete surface while preserving swipe thresholds, snapping, touch behavior, and deletion.
- [x] 5.4 Remove the swipe-delete styling exception and run focused ItemCard swipe tests.

## 6. Documentation And Guard Completion

- [x] 6.1 Update the shared-component README with each specialized control's state model, accessibility contract, composition, and usage boundaries.
- [x] 6.2 Add focused development showcase examples where they clarify reusable component behavior without duplicating full application workflows.
- [x] 6.3 Assert the semantic styling specialized-exception list is empty and the guard rejects consumer reimplementation of each control's visuals.

## 7. Verification

- [x] 7.1 Run all specialized-control and affected composite-component unit tests.
- [x] 7.2 Run category, item card, standard-list, grocery-list, DatePicker, and touch/gesture regression tests.
- [x] 7.3 Run the complete frontend Vitest suite, Svelte type check, and production build.
- [x] 7.4 Validate the `extract-specialized-interaction-controls` OpenSpec change and confirm no specialized styling exceptions remain.
