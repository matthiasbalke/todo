## 1. DatePicker Foundation

- [x] 1.1 Create timezone-safe internal helpers for parsing, serializing, formatting, comparing, and adding to ISO calendar dates.
- [x] 1.2 Create `DatePicker.svelte` with bindable nullable value, label, placeholder, required, disabled, locale, aria label, min, and max props.
- [x] 1.3 Implement the localized trigger and custom calendar dialog with a Monday-first 42-cell grid.

## 2. Calendar Interaction

- [x] 2.1 Implement previous/next month navigation while preserving the selected value.
- [x] 2.2 Implement allowed-date selection, selected/today/adjacent-month styling, and focus return to the trigger.
- [x] 2.3 Implement Today and Clear actions with min/max awareness.
- [x] 2.4 Implement outside-click and Escape dismissal without changing the value.
- [x] 2.5 Implement roving focus and Arrow, Home, End, Page Up, Page Down, Enter, and Space keyboard behavior.

## 3. Component Coverage

- [x] 3.1 Add unit tests for nullable ISO values, localized trigger display, opening, month grid structure, and month navigation.
- [x] 3.2 Add unit tests for selection, Clear, Today, disabled state, min/max constraints, and timezone-safe serialization.
- [x] 3.3 Add unit tests for outside/Escape dismissal, focus return, ARIA semantics, roving tabindex, and all keyboard navigation commands.

## 4. Documentation and Showcase

- [x] 4.1 Document DatePicker props, ISO value contract, localization, constraints, actions, and keyboard behavior in the component README.
- [x] 4.2 Add DatePicker imports, local values, and representative usage snippets to the `/components` route.
- [x] 4.3 Render empty, selected, constrained, and disabled examples with visible bound ISO values.
- [x] 4.4 Add keyboard guidance and a complete DatePicker props reference to the showcase.
- [x] 4.5 Extend component showcase route tests for DatePicker examples, value updates, states, and documentation.

## 5. Verification

- [x] 5.1 Run DatePicker and component showcase test suites.
- [x] 5.2 Run frontend type checks and fix any diagnostics introduced by the component.
- [x] 5.3 Validate the OpenSpec change and verify `ItemForm` and the production `/components` redirect remain unchanged.
