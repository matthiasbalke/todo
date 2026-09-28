## Why

Password values in the shared frontend input are always masked, so administrators cannot verify the SMTP password they are entering. A local visibility control lets users check their entry without copying it to another surface or changing the submitted value.

## What Changes

- Add a visibility toggle to shared `TextInput` instances rendered with `type="password"`.
- Render a right-aligned eye or eye-off icon button inside the input control that switches between masked and plain-text display.
- Provide an accessible control name and state while preserving the existing input binding, validation, disabled state, and submitted value.
- Cover the shared behavior and the SMTP password settings consumer with frontend tests.

## Capabilities

### New Capabilities
- `password-input-visibility`: Password-mode shared inputs expose an accessible, in-field control that toggles whether the current value is masked.

### Modified Capabilities

- None.

## Impact

- Affected frontend shared control: `frontend/src/lib/components/TextInput.svelte`.
- Affected production consumers: the SMTP password field in `frontend/src/routes/(app)/admin/settings/+page.svelte` and the initial setup secret field in `frontend/src/routes/setup/+page.svelte`.
- Affected frontend component and route tests; no backend API, persistence, or dependency changes.
