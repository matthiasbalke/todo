## Why

The passkey sign-in, passkey registration, and account deletion actions render with white text on a white background until hovered because they combine the shared Button's `bare` variant with conflicting filled-color utility classes. These high-impact actions need a visible default state and the intended darker hover state.

## What Changes

- Use the shared Button's semantic `primary` variant for passkey sign-in and registration actions.
- Use the shared Button's semantic `danger` variant for the account deletion action.
- Remove redundant background, text, hover, and other presentation utilities that compete with the selected Button variant while preserving required layout sizing.
- Add regression coverage that verifies the affected actions expose their intended default and hover color classes.

## Capabilities

### New Capabilities
- `account-action-button-styling`: Defines semantic default and hover styling for passkey authentication and account deletion actions.

### Modified Capabilities

None.

## Impact

- Affects the frontend authentication route, account settings route, and their focused component tests.
- Relies on the existing shared `Button` primary and danger variants; no API, backend, dependency, or data-model changes are required.
