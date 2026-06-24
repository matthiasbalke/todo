## Why

The current setup wizard is intentionally available before authentication when no admin exists, which creates a first-admin takeover risk if a fresh instance is reachable before the operator completes setup. Setup should require proof that the person in the browser also has access to the server deployment output.

## What Changes

- Generate a one-time setup secret when the backend enters setup-required mode.
- Log the setup secret to the backend console with clear operator instructions.
- Require the setup secret in the first-admin WebAuthn setup flow before issuing registration options or accepting registration completion.
- Keep setup-only endpoints unavailable after an admin exists, regardless of any provided setup secret.
- Avoid persisting the raw secret; store only enough server-side state to validate it for the current setup window.
- Regenerate the setup secret on backend restart while setup is still required.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `admin-area`: First-admin setup requires an operator setup secret before account creation can begin.

## Impact

- Backend setup status and WebAuthn setup APIs gain setup-secret validation.
- Backend startup/setup services gain secret generation, hashing, in-memory lifecycle management, and console logging.
- Frontend setup page gains a setup-secret field and sends it during setup requests.
- Unit, integration, and E2E coverage update around setup-required mode, invalid secrets, valid setup, restart behavior, and admin-exists behavior.
