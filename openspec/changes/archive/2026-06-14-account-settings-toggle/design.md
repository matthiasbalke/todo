## Context

The `/account` page currently combines profile, Today/timezone preferences, passkeys, and account deletion. Its preference section is titled `Today`, and the Today preference is represented by a generic outlined button whose visible text alternates between enabled and disabled. The timezone picker has a label but no explanation of why an account-level timezone is needed. Unlike the other account controls, these preferences require a separate save action.

The frontend already maintains a shared component library with semantic components, component tests, inventory checks, documentation, and a development showcase. Specialized boolean controls such as completion and starring exist, but there is no general-purpose settings toggle.

`StarToggle` currently uses a general focus ring that remains visible after pointer activation, which appears as an unwanted border when starring or unstarring an item. The Today end-to-end flow also locates the virtual Today list with a broad `/Today/` accessible-name match, which becomes ambiguous when the test creates a list named `Today Source`.

## Goals / Non-Goals

**Goals:**

- Keep the account page heading as `Account` and rename the preference section to `Settings`.
- Explain the account timezone's effect on date-sensitive behavior.
- Introduce a reusable, accessible iOS-style toggle for boolean settings.
- Use the shared toggle for Today View and save both settings immediately.
- Document and test the component and account-page adoption.
- Remove the StarToggle pointer-activation border without removing keyboard focus visibility.
- Make Today end-to-end navigation resilient to list names containing `Today`.

**Non-Goals:**

- Changing `/account` routing or the user-menu destination.
- Changing backend preference APIs, database fields, timezone validation, or Today qualification.
- Replacing domain-specific completion or star controls with the generic toggle.
- Redesigning profile, passkey, or account-deletion interactions.

## Decisions

### Implement Toggle as a semantic button switch

`Toggle` will use a native `button` with `type="button"`, `role="switch"`, and `aria-checked`. Native button behavior provides focus, Enter/Space activation, and disabled semantics without custom keyboard listeners.

The component API is:

- `checked?: boolean`: bindable state, defaulting to `false`
- `disabled?: boolean`: prevents activation, defaulting to `false`
- `ariaLabel?: string`: accessible name when the consumer does not use `aria-labelledby`
- `onchange?: (checked: boolean) => void`: receives the updated value after activation
- `id?: string`: native control identifier
- `class?: string`: parent-layout utilities only
- `element?: HTMLButtonElement | null`: bindable native element

Applicable native button attributes such as `title`, `tabindex`, `aria-describedby`, `aria-labelledby`, and `data-*` will be forwarded. Consumers must provide an accessible name through `ariaLabel` or `aria-labelledby`.

Alternative considered: a visually hidden checkbox with a styled label. A checkbox is valid, but the existing component library favors explicit component callbacks and button-based specialized controls. `role="switch"` also expresses the intended settings interaction directly.

### Keep labels outside the visual toggle

The shared component will own the track and thumb, while the account page owns the visible `Today View` row label. The consumer will pass an accessible name such as `Today View` to the control.

This keeps the primitive reusable for compact settings rows without forcing one label layout. The component documentation must make accessible naming mandatory.

Alternative considered: have Toggle render its own visible label. That would couple the primitive to one row layout and make composition less flexible.

### Save settings immediately

Changing either timezone or Today View clears prior success and error feedback and immediately submits both current values through the existing preference API. Both controls remain disabled while the request is pending to prevent overlapping updates.

On success, the returned values replace local and persisted profile state, Today data and count are refreshed, and `Preferences saved.` is displayed. On failure, both controls return to the last successfully persisted values and error feedback is displayed.

Alternative considered: preserve the explicit save button. This is inconsistent with the other account settings, which persist through their individual interactions.

### Place timezone explanation immediately below TimezonePicker

The supporting text will be a small, muted paragraph directly after the picker. It will explain that the timezone determines the calendar date used by Today and other date-sensitive behavior. The explanation remains visible while controls are disabled during save.

### Add the component to existing shared-component surfaces

`Toggle.svelte` will live with other shared controls, be registered in the shared styling and native-control inventories, documented in `components/README.md`, demonstrated on `/components`, and covered by focused unit tests. Consumers will import it directly from `$lib/components/Toggle.svelte`, matching existing component usage. Account-page tests will verify naming, explanation placement, toggle state, disabled behavior during save, immediate persistence, feedback clearing, and rollback after failure.

### Restrict StarToggle focus treatment to keyboard focus

StarToggle will use `focus-visible` styling so pointer activation does not leave a border or ring around the control. Keyboard navigation will continue to expose a visible focus indicator.

Alternative considered: remove focus styling entirely. That would fix the pointer appearance but make keyboard focus difficult to locate.

### Use route-aware Today end-to-end locators

The Today end-to-end flow will identify the virtual Today link by its exact accessible name and `/today` destination rather than a broad name regex. Source-list navigation will use the known list ID or another exact locator. This permits valid list names such as `Today Source` without Playwright strict-mode ambiguity.

Alternative considered: rename the test list so it does not contain `Today`. That would hide the locator weakness instead of testing the real naming case.

## Risks / Trade-offs

- [Switch visuals could be implemented without sufficient semantics] → Require native button behavior, `role="switch"`, `aria-checked`, accessible naming, focus tests, and keyboard tests.
- [Immediate saving could receive overlapping updates] → Disable both settings controls while a request is pending.
- [A failed save could leave unsaved values visible] → Restore both settings controls to the last successfully persisted values.
- [Generic Toggle could be misused for action buttons] → Document it specifically for persistent boolean settings and retain specialized controls for completion and starring.
- [Supporting text could drift from actual timezone behavior] → Describe stable calendar-date semantics rather than implementation-specific details.
- [Removing the StarToggle ring could harm keyboard accessibility] → Apply the visual treatment only through `focus-visible` and test keyboard focus separately from pointer activation.
- [Accessible names may include count text] → Combine exact naming with route-aware selection where needed instead of relying on a substring regex.

## Migration Plan

1. Add and test the shared Toggle component.
2. Add Toggle documentation, inventory registration, and showcase examples.
3. Rename the preference section and update the timezone and Today View preference presentation and persistence.
4. Adjust StarToggle focus presentation and update component and end-to-end tests.
5. Run frontend checks and tests.

Rollback restores the previous account markup and removes the unused shared Toggle files; no backend or data migration is required.

## Open Questions

None.
