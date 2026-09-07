## Context

See proposal.md for motivation. `MemberInviteEmailInput` currently wraps `EmailInput` and renders member suggestions as a native `datalist`. `MembersDialog` owns suggestion loading, filters out current members, binds `inviteEmail`, and submits `{ email, role }` to the existing member invite API. The backend suggestion API and invite behavior already exist; issue #242 is a frontend interaction regression in real mobile browsers, not a responsive layout problem, because desktop browsers still show options at mobile viewport sizes. The app's custom `Select` component, used by `CategorySelect`, already works on mobile devices because it renders its own input and listbox. The reusable part is the combobox/listbox layout and interaction behavior, not the closed-option select value model.

## Goals / Non-Goals

**Goals:**

- Show matching suggested contacts while typing and make them directly selectable through touch/click activation on mobile and desktop browsers.
- Preserve the existing free-form email input contract, validation, labels, disabled/required props, and bound value behavior.
- Extract and reuse established custom combobox/listbox layout and interaction behavior instead of introducing an unrelated interaction model.
- Keep closed-option selection and free-text suggestion entry as separate wrapper-level value models.
- Keep member suggestion data loading and privacy behavior unchanged.
- Add focused frontend regression tests for the shared control and dialog-level invite submission.

**Non-Goals:**

- No backend API, database, authorization, or rate-limit changes.
- No change to which users are returned as suggestions.
- No change to the public semantics of classic closed-option `Select` consumers.

## Decisions

1. Extract a shared combobox/listbox primitive from the custom `Select` pattern.

   Create a lower-level primitive that owns the UI mechanics currently embedded in `Select`: input shell, popup/listbox positioning, open/closed state, query input, active option index, keyboard navigation, outside/focus-out closing, active-option scrolling, and pointer/touch-safe option activation. The primitive should not own domain value semantics such as "selected category" or "typed invite email."

   Alternative considered: extend `Select` directly with a free-text flag. That would be quicker but risks turning `Select` into a mixed closed-select/free-text component with muddy value semantics. Another alternative is building a member-invite-only listbox; that would fix the bug but duplicate the mobile-working behavior already proven by `CategorySelect`.

2. Keep `Select` as a closed-option wrapper around the primitive.

   Existing `Select` consumers should retain their public API and behavior: options are predefined, `selected` is one of those options, and `onSelect` reports an option. `Select` can delegate layout, query, listbox, keyboard, and focus behavior to the primitive while continuing to own selected-option state and validation.

   Alternative considered: replacing `Select` with a generic free-text combobox API everywhere. That increases regression risk for category, role, timezone, and other classic select use cases that do not need arbitrary text.

3. Rebuild `MemberInviteEmailInput` as a free-text suggestion wrapper around the primitive.

   `MemberInviteEmailInput` should keep a plain string email value. Typing updates the bound email immediately and filters suggestions by email or display name. Activating a suggestion writes that suggestion's email into the same bound value and closes the list. `MembersDialog` should continue submitting the bound `inviteEmail` and should not need to track a selected suggestion object. Suggestions are conveniences for filling the same email input, not a separate invite mode.

   Alternative considered: submit by selected `userId` when a suggestion is chosen. That would require backend/API changes and would make the typed-email path behave differently from the suggestion path without solving the reported mobile interaction problem.

4. Use the proven touch/focus behavior from custom controls.

   Suggestion options should handle pointer/touch selection before the input blur closes the list. The primitive should preserve the custom listbox rendering, focus-out closure, keyboard navigation, and click selection behavior that category selection uses successfully on mobile, and add pointer-down blur protection if needed.

   Alternative considered: delay blur handling with an unrelated timer-only workaround. That is harder to reason about in tests and can produce flaky behavior across browsers.

5. Keep filtering simple and wrapper-owned.

   The primitive may accept already-filtered options or provide generic query hooks, but membership-specific matching should stay in `MemberInviteEmailInput`: show all provided suggestions or narrow them by typed email/display name. `MembersDialog` already removes current-list members from the suggestion list, so neither the primitive nor `Select` should duplicate membership-specific filtering rules.

   Alternative considered: move current-member exclusion into the input. That would make the shared component depend on dialog membership state and blur ownership boundaries.

## Risks / Trade-offs

- Extracting the primitive can regress existing `Select` consumers -> Preserve `Select`'s public API and run category/select/role dialog tests.
- Primitive API can become too abstract -> Keep it focused on layout and interaction mechanics; wrappers own option meaning, selected value, free-text value, and validation.
- Popup overlap in the compact members dialog on small screens -> Use absolute positioning within the input wrapper, bounded width, and a modest max height with scrolling.
- Blur/click ordering can hide suggestions before selection -> Centralize pointer/touch-safe option activation in the primitive and cover with regression tests.
- More custom accessibility responsibility than native datalist -> Keep combobox/listbox semantics in the primitive, preserve wrapper labels, and ensure suggestions are buttons/options with readable names.

## Migration Plan

No data migration is required. Deploy as a frontend-only fix. Rollback is safe because the control still binds and submits the same email string.
