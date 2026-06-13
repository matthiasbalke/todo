## Context

The `/account` page currently combines profile, Today/timezone preferences, passkeys, and account deletion. Its page heading is `Account`, and the Today preference is represented by a generic outlined button whose visible text alternates between enabled and disabled. The timezone picker has a label but no explanation of why an account-level timezone is needed.

The frontend already maintains a shared component library with semantic components, component tests, exports, documentation, and a development showcase. Specialized boolean controls such as completion and starring exist, but there is no general-purpose settings toggle.

## Goals / Non-Goals

**Goals:**

- Rename the account page heading to `Settings`.
- Explain the account timezone's effect on date-sensitive behavior.
- Introduce a reusable, accessible iOS-style toggle for boolean settings.
- Use the shared toggle for Today View while preserving explicit preference saving.
- Document and test the component and account-page adoption.

**Non-Goals:**

- Changing `/account` routing or the user-menu destination.
- Auto-saving preference changes when the toggle is activated.
- Changing backend preference APIs, database fields, timezone validation, or Today qualification.
- Replacing domain-specific completion or star controls with the generic toggle.
- Redesigning profile, passkey, or account-deletion interactions.

## Decisions

### Implement Toggle as a semantic button switch

`Toggle` will use a native `button` with `type="button"`, `role="switch"`, and `aria-checked`. Native button behavior provides focus, Enter/Space activation, and disabled semantics without custom keyboard listeners. The component will expose a bindable `checked` boolean, `disabled`, an accessible-label input, and an optional checked-change callback.

Alternative considered: a visually hidden checkbox with a styled label. A checkbox is valid, but the existing component library favors explicit component callbacks and button-based specialized controls. `role="switch"` also expresses the intended settings interaction directly.

### Keep labels outside the visual toggle

The shared component will own the track and thumb, while the account page owns the visible `Today View` row label. The consumer will pass an accessible name such as `Today View` to the control.

This keeps the primitive reusable for compact settings rows without forcing one label layout. The component documentation must make accessible naming mandatory.

Alternative considered: have Toggle render its own visible label. That would couple the primitive to one row layout and make composition less flexible.

### Preserve explicit preference saving

Activating Today View changes local page state only. The existing `Save Today preferences` action remains responsible for submitting timezone and Today View together, replacing local state with the server response, showing success/error feedback, and refreshing Today data.

Alternative considered: auto-save the toggle. Mixing auto-save for Today View with explicit save for timezone would create inconsistent failure and dirty-state behavior on the same settings card.

### Place timezone explanation immediately below TimezonePicker

The supporting text will be a small, muted paragraph directly after the picker. It will explain that the timezone determines the calendar date used by Today and other date-sensitive behavior. The explanation remains visible while controls are disabled during save.

### Add the component to existing shared-component surfaces

`Toggle.svelte` will live with other shared controls, be exported from the component index, documented in `components/README.md`, demonstrated on `/components`, and covered by focused unit tests. Account-page tests will verify naming, explanation placement, toggle state, disabled behavior during save, and persistence through the existing API call.

## Risks / Trade-offs

- [Switch visuals could be implemented without sufficient semantics] → Require native button behavior, `role="switch"`, `aria-checked`, accessible naming, focus tests, and keyboard tests.
- [The Today toggle may look saved before submission] → Keep the existing explicit save button and success/error messaging; tests distinguish local toggle state from successful persistence.
- [Generic Toggle could be misused for action buttons] → Document it specifically for persistent boolean settings and retain specialized controls for completion and starring.
- [Supporting text could drift from actual timezone behavior] → Describe stable calendar-date semantics rather than implementation-specific details.

## Migration Plan

1. Add and test the shared Toggle component.
2. Add Toggle documentation, exports, and showcase examples.
3. Rename the page heading and update the timezone and Today View preference presentation.
4. Update account component and end-to-end tests.
5. Run frontend checks and tests.

Rollback restores the previous account markup and removes the unused shared Toggle files; no backend or data migration is required.

## Open Questions

None.
