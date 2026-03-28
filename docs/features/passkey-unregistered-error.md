# Passkey Not Registered Error

## Overview

When a user presents a passkey credential that is not registered with this app (e.g., belongs to a deleted account or a different app), the backend returns a clear `404 Not Found` with a structured JSON body instead of throwing an unhandled exception.

## Design Decisions

- **HTTP 404** (not 401): 401 means "authentication failed for a known credential". 404 means "this credential doesn't exist here" — accurate and lets the frontend distinguish the two cases cleanly.
- **Pre-check before crypto**: `UserCredentialRepository.findByCredentialId()` is a pure DB read. Checking it before calling `rpOperations.authenticate()` avoids unnecessary cryptographic work and produces a predictable error path.
- **Message travels from backend**: The error message string lives in the backend `ErrorResponse` DTO and is surfaced via an enhanced `fetchJson()` that reads the `message` field from error response bodies. The frontend forwards `err.message` directly — no string duplication.

## Security Considerations

Returning "passkey not registered" leaks nothing exploitable: credential IDs are random bytes, not tied to email or account existence. Email enumeration is already prevented by the empty `allowCredentials` in `login-options`. This disclosure is distinct from revealing email existence.

## Implementation

### Backend (`AuthController.kt`)

- Added `ErrorResponse(code, message)` DTO.
- Injected `UserCredentialRepository`.
- Changed `login()` return type to `ResponseEntity<*>`.
- Added pre-check: if `findByCredentialId(credential.id) == null`, return `404` with `ErrorResponse("PASSKEY_NOT_REGISTERED", "This passkey is not registered. Please create an account first.")`.

### Frontend (`auth.ts`)

- `fetchJson()` now tries to parse the error response body as JSON and use its `message` field as the error message, falling back to `"$status $statusText"` if not present or not JSON.

### Frontend (`+page.svelte`)

- `passkeyErrorMessage()` has a new `404` case that forwards `err.message` directly to the UI.

## Task Checklist

- [x] Feature doc
- [x] `AuthController.kt` — `ErrorResponse` DTO + pre-check
- [x] `auth.ts` — `fetchJson()` error body parsing
- [x] `+page.svelte` — 404 case in `passkeyErrorMessage()`
- [x] `WebAuthnIntegrationTest.kt` — integration test for unknown credential → 404
- [x] `auth.test.ts` — tests for `fetchJson` error body parsing
- [x] `auth-page.test.ts` — test for 404 error → correct UI message
