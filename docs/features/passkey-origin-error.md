# Passkey Origin Misconfiguration Error Message

## Problem

When the WebAuthn origin is misconfigured (wrong `CORS_ALLOWED_ORIGINS` or `WEBAUTHN_RP_ID`), the frontend previously showed misleading errors:

- **CORS misconfiguration** → Spring Security returns `403 Forbidden` (no JSON body) → frontend showed "Registration is currently disabled"
- **Browser-side RP ID mismatch** → browser throws `DOMException` with `name === 'SecurityError'` → fell through to "Something went wrong — try again"

## Solution

### `ApiError` now captures `code`

`ApiError` accepts an optional `code` field, populated from the `code` field in the backend's `ErrorResponse` JSON body. This lets error handlers distinguish between different 403 causes.

### `passkeyErrorMessage` updated

| Error | Message |
|---|---|
| `DOMException('SecurityError')` | "Passkey origin not allowed — check the server configuration" |
| `ApiError(403, ..., 'REGISTRATION_DISABLED')` | "Registration is currently disabled" |
| `ApiError(403, ...)` without known code | "Passkey origin not allowed — check the server configuration" |

## Files Changed

- `frontend/src/lib/api/auth.ts` — `ApiError` gains optional `code` param; `fetchJson` parses `body.code`
- `frontend/src/routes/auth/+page.svelte` — `passkeyErrorMessage` handles `SecurityError` and distinguishes 403 by code
- `frontend/src/routes/auth/auth-page.test.ts` — three new test cases

## Reproduction

1. Set `WEBAUTHN_RP_ID=wrong.domain` → attempt login → "Passkey origin not allowed — check the server configuration"
2. Set `CORS_ALLOWED_ORIGINS` to exclude the frontend origin → attempt login → same message
