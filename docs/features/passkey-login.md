# Feature: Passkey Login (WebAuthn + JWT)

## Overview

This feature implements passwordless authentication via passkeys (WebAuthn/FIDO2) as the primary login method for the app. Users register a passkey tied to their device biometrics or hardware key; subsequent logins use the browser's built-in credential picker without requiring any typed input. Sessions are maintained with a short-lived JWT access token (in memory) and a long-lived refresh token (HttpOnly cookie). The backend acts as a FIDO2 Relying Party using Spring Security 6.3+ built-in WebAuthn support — no third-party auth service is needed.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| WebAuthn server | Spring Security built-in `WebAuthnRelyingPartyOperations` | Already on classpath; battle-tested; no external dependency |
| JWT library | `jjwt` 0.13.0 | Simpler than Nimbus for self-issued tokens; no JWKS endpoint needed |
| Refresh token storage | HttpOnly; Secure; SameSite=Strict cookie | `security.md` A02/A07 forbid localStorage for tokens |
| Access token storage | `$state` (in memory only) | Short-lived (15 min); lost on reload, restored via silent cookie refresh |
| Access token revocation | `revoked_tokens` DB table keyed on `jti` | A01 requires revocation check on every request; supports immediate logout |
| Refresh token storage | `refresh_tokens` DB table (hashed) | Enables rotation and invalidation per-device |
| Challenge storage | `HttpSessionChallengeRepository` (5-min TTL) | Session lives only for the ceremony; destroyed after tokens are issued |
| Discoverable credentials | `residentKey: required` + `userVerification: required` | Eliminates email enumeration on login; enforces biometric/PIN per A07 |
| UX login flow | "Sign in" (no email) and "Create account" (email + name) | No email enumeration; discoverable credentials let the browser pick the right credential |
| Rate limiting | Bucket4j in-memory, 10 req/IP/min on `/api/auth/**` | A07 requirement; single-node is sufficient for this deployment model |
| CORS | Exact frontend origin from env var; `allowCredentials: true` | Required for HttpOnly cookie to be sent cross-origin in dev; A05 |

---

## Security Considerations

| Control | Implementation |
|---|---|
| `userVerification: required` on all WebAuthn options | Enforces biometric or PIN on every passkey use (A07) |
| No email on login-options | Discoverable credentials — the browser picks the credential; prevents email enumeration (A07) |
| Challenge TTL 5 min, single-use | Stored server-side; destroyed after ceremony completes; prevents replay (A07) |
| `jti` in every access token | Inserted into `revoked_tokens` on logout; checked on every authenticated request (A01) |
| Refresh token rotation | Old hash deleted, new hash inserted on every refresh; limits replay window (A07) |
| Tokens never in localStorage | Access token in JS memory; refresh token in HttpOnly cookie (A02) |
| `alg:none` rejected | jjwt explicit-algorithm parser rejects any other algorithm by default (A07) |
| JWT claims validated | `iss`, `aud`, `exp`, `nbf`, `jti` all validated on every request (A07) |
| Rate limiting on `/api/auth/**` | 10 req/IP/min; returns 429 with `Retry-After` (A07) |
| Actuator limited to `health`+`info` | All other endpoints disabled in `application.yml` (A05) |
| CORS exact-origin | `allowedOrigins` from env var; never `*` with `allowCredentials` (A05) |
| Security response headers | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy` set globally (A05) |

---

## Implementation Plan

### 1. Database — V2 Migration
Add `refresh_tokens` (hashed token, userId FK, expiry) and `revoked_tokens` (jti PK, expiry for pruning) tables.

### 2. Build Dependencies
Add `jjwt-api/impl/jackson` 0.13.0 and `bucket4j-core` 8.14.0 to `backend/build.gradle.kts`.

### 3. Configuration
Update `application.yml` with `webauthn.rp.*`, `jwt.*`, `app.cors.allowed-origins`, and actuator exposure settings. Create `JwtProperties` `@ConfigurationProperties` class.

### 4. JPA Entities & Repositories
Create `User`, `WebAuthnCredential`, `RefreshToken`, `RevokedToken` entities plus their `JpaRepository` interfaces.

### 5. Spring Security WebAuthn Bridges
Implement `PublicKeyCredentialUserEntityRepositoryImpl` and `UserCredentialRepositoryImpl` to connect Spring Security's WebAuthn interfaces to the JPA layer.

### 6. JWT Service
Implement `JwtTokenService`: generate/parse access tokens (HS256, jjwt), generate refresh tokens (SecureRandom 256-bit), hash tokens (SHA-256).

### 7. Security Config + Filters
- `SecurityConfig`: stateless `SecurityFilterChain`, CORS, security headers, permit `/api/auth/**` and actuator.
- `JwtAuthenticationFilter`: parse Bearer token, check revocation, set `SecurityContext`.
- `AuthRateLimitFilter`: Bucket4j sliding window, 10 req/IP/min on `/api/auth/**`.

### 8. Auth Controller
Implement all six endpoints: `register-options`, `register`, `login-options`, `login`, `refresh`, `logout`. Refresh token in HttpOnly cookie; access token in JSON body only.

### 9. Frontend Dependencies & Proxy
Add `@simplewebauthn/browser` to `package.json`. Add `/api` dev proxy with `credentials: true` to `vite.config.ts`.

### 10. Frontend API Client
Create `src/lib/api/auth.ts` with typed `fetch` wrappers for all six auth endpoints; all use `credentials: 'include'`.

### 11. Frontend Auth Store
Replace mock store with real `AuthUser` state: `setSession`, `clearSession`, `restoreSession` (silent cookie refresh), `isAuthenticated`, `getAccessToken`.

### 12. Frontend Login Page
Replace stub with real flows: "Sign in with Passkey" (no email, browser picker) and "Create account" (email + display name). Error states for `NotAllowedError` and 429.

### 13. Frontend Auth Guard
Create `(app)/+layout.ts` with `restoreSession()` + redirect to `/auth`. Update `(app)/+layout.svelte` to use real user and call `logout()` on sign-out.

### 14. Tests
- Backend unit: `JwtTokenServiceTest` (no Spring context).
- Backend integration: `WebAuthnIntegrationTest` extending `AbstractIntegrationTest`.
- Frontend Vitest: `auth.ts` API client + `AuthPage` component.

---

## Tasks

### User can register a new account with a passkey

- [x] Create Flyway migration `V1__create_users.sql`: `users`, `webauthn_credentials` tables
- [x] Create Flyway migration `V2__add_auth_tokens.sql`: `refresh_tokens`, `revoked_tokens` tables
- [x] Create `User` JPA entity + `UserRepository`
- [x] Create `WebAuthnCredential` JPA entity + `WebAuthnCredentialRepository`
- [x] Create `RefreshToken` JPA entity + `RefreshTokenRepository`
- [x] Create `RevokedToken` JPA entity + `RevokedTokenRepository`
- [x] Implement Spring Security `PublicKeyCredentialUserEntityRepositoryImpl`
- [x] Implement Spring Security `UserCredentialRepositoryImpl`
- [x] Implement `POST /api/auth/webauthn/register-options`: upsert user by email, return `PublicKeyCredentialCreationOptions` with `residentKey: required`, `userVerification: required`
- [x] Implement `POST /api/auth/webauthn/register`: verify attestation, store credential, issue JWT pair, return access token + set refresh cookie
- [x] Add `@simplewebauthn/browser` to frontend `package.json`
- [x] Add `/api` dev proxy (with `credentials: true`) to `vite.config.ts`
- [x] Create `src/lib/api/auth.ts`: `getRegisterOptions`, `submitRegistration`, `refreshAccessToken`, `logout` functions
- [x] Replace mock `auth.svelte.ts` with real session state: `setSession`, `clearSession`, `restoreSession`, `isAuthenticated`, `getAccessToken`
- [x] Implement "Create account" flow in login page: email + displayName form → `getRegisterOptions` → `startRegistration` → `submitRegistration` → `setSession` → redirect
- [x] Write backend unit tests for `JwtTokenService`
- [x] Write backend integration test: `register-options` creates user, `register` stores credential and returns tokens

### User can sign in with an existing passkey

- [x] Implement `POST /api/auth/webauthn/login-options`: no request body, return options with empty `allowCredentials` (discoverable), `userVerification: required`
- [x] Implement `POST /api/auth/webauthn/login`: verify assertion, resolve user from userHandle, issue JWT pair
- [x] Add `getLoginOptions` and `submitLogin` to `src/lib/api/auth.ts`
- [x] Implement "Sign in with Passkey" flow in login page: `getLoginOptions` → `startAuthentication` → `submitLogin` → `setSession` → redirect; handle `NotAllowedError` and 429
- [x] Write backend integration tests: `login-options` returns challenge without email lookup, `login` returns tokens

### Session is maintained across page reloads

- [x] Implement `POST /api/auth/refresh`: read HttpOnly cookie, verify hash in DB, rotate token, return new access token
- [x] Implement `restoreSession()` in auth store: calls `/api/auth/refresh` on app load; SSR-safe guard
- [x] Create `(app)/+layout.ts`: call `restoreSession()`, redirect to `/auth` if not authenticated
- [x] Update `(app)/+layout.svelte`: use `getCurrentUser()` (real) instead of `mockUsers[0]`
- [x] Write backend integration test: `refresh` rotates cookie and returns new access token; expired/unknown token returns 401

### User can sign out

- [x] Implement `POST /api/auth/logout`: revoke access token `jti`, delete refresh token row, clear cookie; return 204
- [x] Implement `logout()` in `src/lib/api/auth.ts`
- [x] Wire logout in `(app)/+layout.svelte`: call `logout()` → `clearSession()` → redirect to `/auth`
- [x] Write backend integration test: after logout, old access token returns 401; cookie is cleared

### Rate limiting and security hardening

- [x] Add jjwt 0.13.0 and bucket4j-core 8.14.0 to `build.gradle.kts`
- [x] Update `application.yml`: `webauthn`, `jwt`, `app.cors`, actuator exposure
- [x] Create `JwtProperties` `@ConfigurationProperties` class
- [x] Implement `SecurityConfig`: stateless filter chain, CORS (env var), security headers
- [x] Implement `JwtAuthenticationFilter`: validate JWT, check `revoked_tokens`, set `SecurityContext`
- [x] Implement `AuthRateLimitFilter`: Bucket4j, 10 req/IP/min on `/api/auth/**`, return 429 with `Retry-After`
- [x] Write backend integration test: 11th request to auth endpoint returns 429
- [x] Write frontend Vitest test: `AuthPage` renders correctly, create-account form shows/hides, 429 shows rate-limit message, `NotAllowedError` shows cancel message
