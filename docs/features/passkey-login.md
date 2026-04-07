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

**New file:** `backend/src/main/resources/db/migration/V2__add_auth_tokens.sql`

```sql
CREATE TABLE refresh_tokens (
    id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL UNIQUE,        -- SHA-256 of raw token value
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

CREATE TABLE revoked_tokens (
    jti        TEXT        NOT NULL PRIMARY KEY,   -- UUID claim from access token
    expires_at TIMESTAMPTZ NOT NULL,               -- copy from token; for pruning
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

A scheduled job (or lazy-prune on lookup) removes `revoked_tokens` rows past `expires_at`.

> Subsequent feature migrations start from V3.

---

### 2. Build Dependencies

**Edit:** `backend/build.gradle.kts`

```kotlin
// JWT
implementation("io.jsonwebtoken:jjwt-api:0.13.0")
runtimeOnly("io.jsonwebtoken:jjwt-impl:0.13.0")
runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.13.0")

// Rate limiting (Bucket4j — pure Java, no Redis needed for single-node)
implementation("com.bucket4j:bucket4j-core:8.14.0")
```

---

### 3. Configuration

**Edit:** `backend/src/main/resources/application.yml`

```yaml
webauthn:
  rp:
    id: ${WEBAUTHN_RP_ID:localhost}
    name: ${WEBAUTHN_RP_NAME:Todo}

jwt:
  secret: ${JWT_SECRET}            # Base64-encoded, min 32 bytes; no default — fails to start if absent
  issuer: ${JWT_ISSUER:todo-app}
  audience: ${JWT_AUDIENCE:todo-api}
  access-token-ttl: PT15M
  refresh-token-ttl: P30D

app:
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5173}

management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: never
```

**New file:** `backend/src/main/kotlin/com/github/matthiasbalke/todo/auth/JwtProperties.kt`
- `@ConfigurationProperties(prefix = "jwt")` data class: `secret`, `issuer`, `audience`, `accessTokenTtl: Duration`, `refreshTokenTtl: Duration`

---

### 4. JPA Entities & Repositories

Package: `com.github.matthiasbalke.todo.auth`

**`User.kt`** — `users` table: `id: UUID`, `email: String`, `displayName: String`, `createdAt: Instant`

**`WebAuthnCredential.kt`** — `webauthn_credentials`: `id: UUID`, `userId: UUID`, `credentialId: ByteArray`, `publicKey: ByteArray`, `signCount: Long`, `createdAt: Instant`

**`RefreshToken.kt`** — `refresh_tokens`: `id: UUID`, `userId: UUID`, `tokenHash: String`, `expiresAt: Instant`, `createdAt: Instant`

**`RevokedToken.kt`** — `revoked_tokens`: `jti: String` (PK), `expiresAt: Instant`, `revokedAt: Instant`

**Repositories** (all `JpaRepository`):
- `UserRepository` + `findByEmail(email): User?`
- `WebAuthnCredentialRepository` + `findByCredentialId(bytes): WebAuthnCredential?` + `findAllByUserId(userId): List<WebAuthnCredential>`
- `RefreshTokenRepository` + `findByTokenHash(hash): RefreshToken?` + `deleteAllByUserId(userId)`
- `RevokedTokenRepository` + `existsByJti(jti): Boolean` + `deleteByExpiresAtBefore(cutoff: Instant)`

---

### 5. Spring Security WebAuthn Bridges

**`PublicKeyCredentialUserEntityRepositoryImpl.kt`**

Implements `PublicKeyCredentialUserEntityRepository`. Delegates to `UserRepository`.
- User handle = `User.id` serialized to bytes
- `findById(bytes)`: deserialize UUID → look up user
- `save(entity)`: no-op — user is created in the controller before the ceremony

**`UserCredentialRepositoryImpl.kt`**

Implements `UserCredentialRepository`. Delegates to `WebAuthnCredentialRepository`.
- `save(record: CredentialRecord)`: upsert — check if `credentialId` exists; insert new or update `signCount`
- Maps `CredentialRecord` ↔ `WebAuthnCredential` (credentialId, publicKey.encoded, signatureCount)

---

### 6. JWT Service

**`JwtTokenService.kt`** (`@Service`)

- `generateAccessToken(user: User): String`
  - Claims: `sub=userId`, `email`, `displayName`, `jti=UUID.randomUUID()`, `iss`, `aud`, `iat`, `nbf=iat`, `exp=iat+15m`
  - Signed with HMAC-SHA256 via `Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret))`
- `generateRefreshToken(): String` — `SecureRandom` 256-bit, hex-encoded
- `hashToken(raw: String): String` — SHA-256, hex output
- `parseAccessToken(token: String): Claims`
  - Validates signature, `exp`, `nbf`, `iss`, `aud`
  - Rejects `alg:none` (jjwt's parser is explicit-algorithm only by default)
  - Returns claims on success, throws `JwtException` on any failure

---

### 7. Security Config + Filters

**`SecurityConfig.kt`** — `@Configuration @EnableWebSecurity`

```kotlin
@Bean
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
    http
        .csrf { it.disable() }               // stateless JWT; CSRF via SameSite=Strict on refresh cookie
        .sessionManagement { it.sessionCreationPolicy(STATELESS) }
        .cors { it.configurationSource(corsConfigurationSource()) }
        .authorizeHttpRequests {
            it.requestMatchers("/api/auth/**", "/actuator/health", "/actuator/info").permitAll()
            it.anyRequest().authenticated()
        }
        .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter::class.java)
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter::class.java)
        .headers { headers ->
            headers.contentTypeOptions(withDefaults())
            headers.frameOptions { it.deny() }
            headers.referrerPolicy { it.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN) }
        }
    return http.build()
}
```

**`JwtAuthenticationFilter.kt`** — `OncePerRequestFilter`

1. Read `Authorization: Bearer <token>` header; skip if absent
2. `jwtTokenService.parseAccessToken(token)` — throws on invalid/expired
3. Check `revokedTokenRepository.existsByJti(claims.id)` — reject with 401 if revoked
4. Set `UsernamePasswordAuthenticationToken(userId, null, emptyList())` in `SecurityContextHolder`

**`AuthRateLimitFilter.kt`** — `OncePerRequestFilter`

- Only applies to paths matching `/api/auth/**`
- Uses Bucket4j: one bucket per IP (ConcurrentHashMap), 10 tokens, refill 10/minute
- Returns `429 Too Many Requests` with `Retry-After` header when bucket empty

---

### 8. Auth Controller

**`AuthController.kt`** — `@RestController @RequestMapping("/api/auth")`

Request/response types:
```kotlin
data class RegisterOptionsRequest(val email: String, val displayName: String)
data class TokenResponse(val accessToken: String, val user: UserDto)
// refreshToken is NOT in the JSON body — it is set as an HttpOnly cookie
data class UserDto(val id: String, val email: String, val displayName: String)
```

Cookie helper:
```kotlin
fun refreshTokenCookie(value: String, maxAge: Duration): ResponseCookie =
    ResponseCookie.from("refreshToken", value)
        .httpOnly(true)
        .secure(true)
        .sameSite("Strict")
        .path("/api/auth")          // scope to auth endpoints only
        .maxAge(maxAge)
        .build()
```

**`POST /webauthn/register-options`** — body: `RegisterOptionsRequest`
1. Upsert user by email
2. Build `PublicKeyCredentialCreationOptions` with `residentKey: required`, `userVerification: required`
3. Store challenge via `HttpSessionChallengeRepository` (5-min TTL)
4. Return options JSON

**`POST /webauthn/register`**
1. Load + validate challenge from session
2. `rpOps.authenticate(registrationResponse)` → internally calls `UserCredentialRepository.save()`
3. Issue access token + refresh token; store refresh hash in DB
4. Set refresh token as HttpOnly cookie; destroy session
5. Return `TokenResponse` (access token + user; **no** refreshToken in body)

**`POST /webauthn/login-options`** — no request body
1. Generate options with empty `allowCredentials` (browser's credential picker)
2. **No user lookup** — prevents email enumeration
3. `userVerification: required`; store challenge; return options

**`POST /webauthn/login`**
1. Load challenge; `rpOps.authenticate(authenticationResponse)`
2. Resolve user from `userHandle` in assertion response
3. Issue tokens; set refresh cookie; destroy session
4. Return `TokenResponse`

**`POST /refresh`** — reads cookie, no request body
1. Read `refreshToken` from HttpOnly cookie
2. Hash it; look up in `refresh_tokens`; verify `expiresAt > now()`
3. Rotate: delete old row, insert new row with new hash + new expiry
4. Issue new access token; set new refresh cookie; return `{ accessToken, user }`

**`POST /logout`** — requires valid access token in header
1. Extract `jti` from access token claims (already validated by filter)
2. Insert `jti` into `revoked_tokens` with `expires_at` copied from the token
3. Read `refreshToken` cookie; hash it; delete the row from `refresh_tokens`
4. Clear the refresh cookie (set `maxAge=0`); return `204 No Content`

---

### 9. Frontend Dependencies & Proxy

```bash
bun add @simplewebauthn/browser@13.3.0
```

**Edit:** `frontend/vite.config.ts` — add dev proxy:
```typescript
server: {
  proxy: { '/api': { target: 'http://localhost:8080', credentials: true } }
}
```
`credentials: true` is required to forward the HttpOnly cookie in dev.

---

### 10. Frontend API Client

**New file:** `frontend/src/lib/api/auth.ts`

```typescript
export interface AuthUser { id: string; email: string; displayName: string; }
export interface TokenResponse { accessToken: string; user: AuthUser; }
// No refreshToken in response — it arrives as a cookie

export async function getRegisterOptions(email: string, displayName: string): Promise<PublicKeyCredentialCreationOptionsJSON>
export async function submitRegistration(response: RegistrationResponseJSON): Promise<TokenResponse>
export async function getLoginOptions(): Promise<PublicKeyCredentialRequestOptionsJSON>  // no email param
export async function submitLogin(response: AuthenticationResponseJSON): Promise<TokenResponse>
export async function refreshAccessToken(): Promise<TokenResponse>  // no param — cookie sent automatically
export async function logout(): Promise<void>                        // no param — server reads cookie + jti
```

All `fetch` calls use `{ credentials: 'include' }` so cookies are sent cross-origin in dev.

---

### 11. Frontend Auth Store

**Edit:** `frontend/src/lib/stores/auth.svelte.ts`

```typescript
let currentUser = $state<AuthUser | null>(null);
let accessToken = $state<string | null>(null);

// No localStorage — refresh token lives in HttpOnly cookie only

export function getCurrentUser(): AuthUser | null
export function getAccessToken(): string | null
export function isAuthenticated(): boolean
export function setSession(r: TokenResponse): void   // stores accessToken + user in memory
export function clearSession(): void                 // clears memory state only
export async function restoreSession(): Promise<void>
  // Calls /api/auth/refresh (browser sends cookie automatically)
  // Sets state if successful; no-op if cookie absent/expired
  // Guards: if (typeof window === 'undefined') return  ← SSR guard
```

---

### 12. Frontend Login Page

**Edit:** `frontend/src/routes/auth/+page.svelte`

State machine: `'idle' | 'register-form' | 'in-progress' | 'error'`

```
[Sign in with Passkey]      ← no email, browser credential picker
[Create account]            ← expands to: email input + display name input + [Register] button
```

**Sign-in flow**: `getLoginOptions()` → `startAuthentication(options)` → `submitLogin(r)` → `setSession(r)` → `goto('/lists')`

**Register flow**: `getRegisterOptions(email, displayName)` → `startRegistration(options)` → `submitRegistration(r)` → `setSession(r)` → `goto('/lists')`

Error handling:
- `NotAllowedError` (user cancelled): show "Cancelled — try again"
- `ApiError` 429: show "Too many attempts — please wait"
- Generic: show "Something went wrong — try again"

---

### 13. Frontend Auth Guard + Layout

**New file:** `frontend/src/routes/(app)/+layout.ts`
```typescript
export async function load() {
  await restoreSession();    // attempts cookie-based refresh; SSR-safe
  if (!isAuthenticated()) redirect(307, '/auth');
}
```

**Edit:** `frontend/src/routes/(app)/+layout.svelte`
- Replace `mockUsers[0]` with `getCurrentUser()`
- Logout: `await logout()` (server clears cookie + revokes token) → `clearSession()` → `goto('/auth')`

---

### 14. Tests

#### Backend Unit — `JwtTokenServiceTest.kt`
No Spring context. Tests:
- Access token contains `jti`, `iss`, `aud`, `nbf`, `sub`, `exp`
- `parseAccessToken` succeeds on valid token
- `parseAccessToken` throws on expired token (TTL=0)
- `parseAccessToken` throws on tampered signature
- `parseAccessToken` throws on wrong `iss` / `aud`
- `hashToken` is deterministic and SHA-256 length (64 hex chars)
- `generateRefreshToken` produces 64 hex chars

#### Backend Integration — `WebAuthnIntegrationTest.kt`
Extends `AbstractIntegrationTest`. Uses Spring Security's `WebAuthnRegistrationRequestBuilder` / `WebAuthnAuthenticationRequestBuilder`.

Test cases:
- `register-options` → 200, creates user in DB
- `register` → 200, returns access token, sets `Set-Cookie: refreshToken`
- `login-options` → 200, no user lookup (no email in body)
- `login` → 200, returns tokens
- `refresh` → 200, rotates cookie, returns new access token
- `logout` → 204, `jti` added to `revoked_tokens`, cookie cleared
- Revoked token: request with revoked `jti` → 401
- Rate limit: 11th request to auth endpoint → 429

#### Frontend — `auth.ts` (Vitest)
Mock `fetch`. Verify:
- `credentials: 'include'` on all calls
- `getLoginOptions` takes no parameters
- `TokenResponse` has no `refreshToken` field

#### Frontend — `AuthPage.test.ts` (component)
Mock `@simplewebauthn/browser` + `$lib/api/auth`. Test:
- Renders two buttons
- "Create account" reveals form
- Sign-in calls `startAuthentication`
- Success navigates to `/lists`
- 429 shows rate-limit message
- `NotAllowedError` shows cancel message

---

## Critical Files

| File | Action |
|---|---|
| `backend/build.gradle.kts` | Add jjwt 0.13.0 + bucket4j |
| `backend/src/main/resources/application.yml` | Add webauthn, jwt, cors, actuator config |
| `backend/src/main/resources/db/migration/V2__add_auth_tokens.sql` | New — refresh_tokens + revoked_tokens |
| `backend/src/main/kotlin/.../auth/` | New package — all auth classes |
| `backend/src/test/kotlin/.../AbstractIntegrationTest.kt` | Reference — all integration tests extend this |
| `frontend/package.json` | Add @simplewebauthn/browser@13.3.0 |
| `frontend/vite.config.ts` | Add dev proxy with credentials |
| `frontend/src/lib/api/auth.ts` | New |
| `frontend/src/lib/stores/auth.svelte.ts` | Replace mock |
| `frontend/src/routes/auth/+page.svelte` | Wire real flows |
| `frontend/src/routes/(app)/+layout.ts` | New — auth guard |
| `frontend/src/routes/(app)/+layout.svelte` | Real user + logout |

---

## Verification

1. `./gradlew test` — all tests pass including JWT revocation and rate limit tests
2. `docker compose up --build` — Flyway applies V1 + V2, backend starts
3. `bun run dev` → `http://localhost:5173` → redirected to `/auth`
4. Click "Sign in with Passkey" → browser shows credential picker → cancel (first time: empty)
5. Click "Create account" → enter email + name → passkey prompt → success → `/lists`
6. Reload → stays on `/lists` (cookie restored session)
7. Logout → `/auth`, `revoked_tokens` has the `jti` row, cookie is cleared
8. Reuse old access token after logout → 401
9. `bun run check` — no TypeScript errors

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
