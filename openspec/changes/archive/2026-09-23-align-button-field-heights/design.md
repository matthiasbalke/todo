## Context

See `proposal.md` for motivation. The current shared `TextInput` component selects default field geometry, and Button already has a `field` size with matching padding. The admin SMTP settings test-email row exposed a mismatch because it used the shorter `small` Button size beside a default TextInput.

## Goals / Non-Goals

**Goals:**

- Clarify and verify that the existing Button `field` size is the semantic way to render a field-adjacent action.
- Demonstrate the field-adjacent pattern in the Button showcase with a default text input and Button side by side.
- Keep SMTP settings markup simple and free of ad hoc height or padding overrides.
- Preserve intentionally compact, icon, menu, header, chip, and row button geometry.

**Non-Goals:**

- Redesign Button colors, tones, appearances, typography, or interaction states.
- Change TextInput labeling, validation, value binding, or accessibility behavior.
- Make every Button the same height as text inputs.
- Add new backend behavior.

## Decisions

### Treat this as semantic size selection, not an SMTP-only visual patch

The mismatch comes from using `size="small"` for a Button that is visually part of a field row. The existing `field` Button size is the appropriate semantic size for an action placed beside a default TextInput.

Alternative considered: pass custom layout classes to the SMTP Button. That would be faster but conflicts with the semantic component styling direction where controls own internal spacing and consumers provide only layout classes.

### Prefer the existing field Button size

Field-adjacent actions should select `size="field"` when they sit beside default input controls. Button internals should remain unchanged unless tests show that `field` no longer matches default TextInput geometry.

Alternative considered: change the default or small Button size globally. That risks unintentionally changing standalone actions and compact form buttons that are not field-adjacent.

### Keep geometry and typography independent

Field alignment should come from geometry, not from changing font size or line height. This matches the shared style foundation’s existing direction that typography and geometry are independently selectable.

Alternative considered: reduce the TextInput size to match the current small Button. That would make the SMTP row smaller but would degrade the input’s established touch target and mobile text-entry behavior.

### Document the pattern in the showcase

The Button showcase should include a realistic field row with a default TextInput and a `size="field"` Button. This makes the intended semantic size discoverable outside the SMTP settings page and gives reviewers a stable place to inspect alignment.

Alternative considered: rely only on the SMTP settings page as the example. That would prove the immediate fix but bury the shared-control guidance inside one product workflow.

## Risks / Trade-offs

- [Wrong size keeps being selected by consumers] -> Add tests and specs that identify `field` as the expected field-adjacent Button size.
- [Field Button changes affect other consumers] -> Avoid changing Button internals unless geometry verification proves the existing field size is wrong.
- [Class-string tests become brittle] -> Verify shared geometry through component tests focused on semantic size output and representative consumer markup.
- [Visual alignment is hard to assert in jsdom] -> Cover classes in unit tests and use browser/E2E or screenshot review for the representative SMTP row when practical.
- [Multiple button sizes are confusing] -> Document the intended use of field/default/small/compact sizes in the Button spec and tests.

## Migration Plan

1. Verify the existing Button `field` size matches default TextInput geometry.
2. Change the admin SMTP test-email action to use `size="field"` instead of the smaller action size.
3. Add a Button showcase example rendering a default TextInput and field-sized Button side by side.
4. Add Button tests, showcase tests, and admin settings tests for the aligned field-adjacent action and expected size choice.
5. Run frontend type-check and unit tests; run relevant visual or E2E checks if available.
