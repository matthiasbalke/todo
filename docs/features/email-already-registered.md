# Email Already Registered

## Overview

When a user submits the registration form, the backend checks whether the email address is already associated with an existing account. If so, it rejects the request with a 409 Conflict and a human-readable error message. The frontend forwards this message so the user knows exactly why registration failed.

## Design decisions

- **Return 409 Conflict, not 422**: 409 means "conflict with current resource state" — the email already exists. 422 would imply malformed input. 409 is the correct semantic here.
- **Remove the upsert**: The previous behaviour silently returned the existing user and allowed a second passkey to be added to that account. That was a latent bug — an attacker who knows your email could register an additional credential on your account. Blocking with 409 prevents this.
- **Structured error body with a code**: Consistent with the existing `ErrorResponse(code, message)` pattern used on `login` (e.g. `PASSKEY_NOT_REGISTERED`).
- **Frontend forwards the backend message for 409**: Same pattern as the 404 case for unregistered passkeys — the backend owns the copy, the frontend just renders it.

## Security considerations

- Blocking duplicate email registration closes the credential-hijacking vector described above (A01 — Broken Access Control).
- The 409 response discloses that an email is registered. This is acceptable: the registration form already requires the user to type their own email, and the alternative (silently succeeding) would be worse. This is consistent with common practice for email-based registration.
- Rate limiting on `/api/auth/**` (10 req/IP/min, A07) already limits email enumeration attempts.

## Implementation plan

1. Change `registerOptions()` in `AuthController.kt`: if `userRepository.findByEmail(email)` returns a user, return `ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponse(...))` instead of proceeding.
2. Update the existing integration test that expected 200 for a duplicate email — it must now expect 409.
3. Add a new integration test asserting 409 + correct error body.
4. Handle `ApiError` status 409 in `passkeyErrorMessage()` on the frontend — forward `err.message`.

## Tasks

### Registration rejects duplicate emails

- [x] Backend: return 409 with `EMAIL_ALREADY_REGISTERED` when `register-options` is called with an already-registered email
- [x] Backend: update existing test `register-options returns 200 for existing user without creating duplicate` to expect 409 with correct error body
- [x] Backend: add integration test asserting the happy path (new email) still returns 200
- [x] Frontend: handle `ApiError` 409 in `passkeyErrorMessage()` by forwarding `err.message`
