# Feature: Passkey Login (WebAuthn + JWT)

## Tasks

### 2. Authentication

#### Database
- [x] Create Flyway migration `V1__create_users.sql`: `users`, `webauthn_credentials`, `oauth_identities` tables

#### Backend
- [ ] Create `User` JPA entity and `UserRepository`
- [ ] Create `WebAuthnCredential` JPA entity and repository
- [ ] Create `OAuthIdentity` JPA entity and repository
- [ ] Configure Spring Security `SecurityFilterChain`: permit `/api/auth/**`, `/actuator/health`; require JWT for all other `/api/**`
- [ ] Implement JWT `TokenService`: issue access token + refresh token (HS256, configurable secret + expiry)
- [ ] Implement `JwtAuthenticationFilter`: validates JWT, sets `SecurityContext`
- [ ] Implement `POST /api/auth/webauthn/register-options`: returns `PublicKeyCredentialCreationOptions` for given email; creates user if not exists
- [ ] Implement `POST /api/auth/webauthn/register`: verifies attestation, stores `WebAuthnCredential`, returns JWT pair
- [ ] Implement `POST /api/auth/webauthn/login-options`: looks up user by email, returns `PublicKeyCredentialRequestOptions`
- [ ] Implement `POST /api/auth/webauthn/login`: verifies assertion, returns JWT pair
- [ ] Implement Google OAuth2 login (`GET /api/auth/oauth2/google` redirect + `GET /api/auth/oauth2/callback`): links or creates account by email, returns JWT pair
- [ ] Implement `POST /api/auth/refresh`: validates refresh token, issues new access token
- [ ] Implement `POST /api/auth/logout`: invalidates refresh token (server-side blocklist or short expiry)
- [ ] Write unit tests for `TokenService` (issue, validate, expired, tampered)
- [ ] Write integration tests for WebAuthn register + login flows (using a test FIDO2 authenticator/stub)

#### Frontend
- [x] Create `auth/login/+page.svelte`: email input field, "Continue with passkey" button, "Sign in with Google" button
- [ ] Implement passkey registration flow: call `register-options` → `navigator.credentials.create()` → `register` → store JWT → redirect
- [ ] Implement passkey login flow: call `login-options` → `navigator.credentials.get()` → `login` → store JWT → redirect
- [ ] Implement Google OAuth2 button: redirects to `/api/auth/oauth2/google`; handle callback page that stores JWT
- [ ] Implement token refresh: intercept 401 responses in API client, call `/api/auth/refresh`, retry original request
- [ ] Implement logout: call `POST /api/auth/logout`, clear tokens, redirect to login
- [ ] Create typed API client in `src/lib/api/` (one file per resource: `lists.ts`, `items.ts`, `auth.ts`, etc.) wrapping `fetch` with JWT header injection and token refresh
- [ ] Write Vitest component tests for the login page (renders correctly, form validation)

#### E2E
- [ ] E2E: user registration via passkey (using Playwright's WebAuthn virtual authenticator)
- [x] Configure Playwright: `playwright.config.ts` pointing to `http://localhost:3000` (frontend); set up `docker compose` global setup

---

### 3. Account Management

#### Backend
- [ ] Implement `GET /api/users/me`: returns current user's profile (id, email, displayName)
- [ ] Implement `PUT /api/users/me`: updates `displayName` (and email if not linked to OAuth)
- [ ] Implement `GET /api/users/me/deletion-preview`: returns lists to be deleted (sole OWNER) and lists to be removed from
- [ ] Implement `DELETE /api/users/me`: deletes account data per spec (memberships, subscriptions, credentials, sole-owned lists)
- [ ] Write integration test for account deletion: sole-owned list deleted, shared list membership only removed

#### E2E
- [ ] E2E: account deletion confirmation — verify preview screen lists correct lists before confirming
- [ ] E2E: account deletion — confirm, verify user is logged out and their sole-owned list is gone

---

## Implementation Plan

### Context

The app needs real authentication before any other backend feature can be built. Passkey (WebAuthn/FIDO2) is the primary login method per requirements. The backend has the DB schema (users + webauthn_credentials in V1), Spring Security on the classpath, and Testcontainers test infra in place — but zero auth code. The frontend has a stub login page. This plan implements the full passkey register + login + JWT flow, incorporating all controls from `docs/security.md`.

**Scope**: Passkey only (register + login + revocation). Google OAuth is a separate task.

---

### Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| JWT library | `jjwt` 0.13.0 | Simpler than Nimbus for self-issued tokens; no JWKS endpoint needed |
| WebAuthn server | Spring Security built-in `WebAuthnRelyingPartyOperations` | Already on classpath; battle-tested |
| Refresh token storage | **HttpOnly; Secure; SameSite=Strict cookie** | security.md A02/A07 forbid localStorage for tokens |
| Access token storage | `$state` (memory only) | Short-lived (15 min); lost on reload, restored via cookie |
| Access token revocation | `revoked_tokens` DB table keyed on `jti` | A01 requires revocation check on every request |
| Challenge storage | `HttpSessionChallengeRepository` (5-min TTL) | Session lives only for the ceremony, destroyed after tokens issued |
| Discoverable credentials | `residentKey: required` + `userVerification: required` | Eliminates email enumeration; enforces biometric/PIN per A07 |
| UX flow | Separate "Sign in" (no email) and "Create account" (email + name) buttons | No email enumeration; no "try login first" logic |
| Rate limiting | Spring filter, 10 req/IP/min on `/api/auth/**` | A07 requirement |
| CORS | Exact frontend origin from env var; `allowCredentials: true` | Required for cookie-based refresh tokens; A05 |

---

### Implementation Order

#### 1. Backend — Flyway V2 Migration

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

#### 2. Backend — Build Dependencies

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

#### 3. Backend — Config

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

#### 4. Backend — JPA Entities & Repositories

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

#### 5. Backend — Spring Security WebAuthn Bridges

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

#### 6. Backend — JWT Service

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

#### 7. Backend — Security Config

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

@Bean
fun corsConfigurationSource(): CorsConfigurationSource {
    val config = CorsConfiguration()
    config.allowedOrigins = allowedOrigins.split(",")  // from @Value
    config.allowedMethods = listOf("GET", "POST", "PUT", "PATCH", "DELETE")
    config.allowedHeaders = listOf("Authorization", "Content-Type")
    config.allowCredentials = true                     // required for HttpOnly cookie
    val source = UrlBasedCorsConfigurationSource()
    source.registerCorsConfiguration("/api/**", config)
    return source
}

@Bean
fun webAuthnRelyingPartyOperations(...): WebAuthnRelyingPartyOperations {
    return Webauthn4JRelyingPartyOperations(
        userEntityRepository,
        credentialRepository,
        PublicKeyCredentialRpEntity.builder().id(rpId).name(rpName).build(),
        setOf("https://$rpId", "http://localhost:8080")
    )
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

#### 8. Backend — Auth Controller

**`AuthController.kt`** — `@RestController @RequestMapping("/api/auth")`

##### Request / Response types

```kotlin
data class RegisterOptionsRequest(val email: String, val displayName: String)
// No RefreshRequest — refresh reads HttpOnly cookie

data class TokenResponse(val accessToken: String, val user: UserDto)
// refreshToken is NOT in the JSON body — it is set as an HttpOnly cookie
data class UserDto(val id: String, val email: String, val displayName: String)
```

##### Cookie helper

```kotlin
fun refreshTokenCookie(value: String, maxAge: Duration): ResponseCookie =
    ResponseCookie.from("refreshToken", value)
        .httpOnly(true)
        .secure(true)               // HTTPS in production; browsers accept for localhost
        .sameSite("Strict")
        .path("/api/auth")          // scope to auth endpoints only
        .maxAge(maxAge)
        .build()
```

##### Endpoints

**`POST /webauthn/register-options`** — body: `RegisterOptionsRequest`
1. Upsert user by email (create if new, return existing if already registered)
2. Build `PublicKeyCredentialCreationOptions` with:
   - `authenticatorSelection.residentKey = "required"`, `requireResidentKey = true`
   - `authenticatorSelection.userVerification = "required"` ← enforces biometric/PIN (A07)
3. Store challenge via `HttpSessionChallengeRepository` (session TTL = 5 min)
4. Return options JSON

**`POST /webauthn/register`**
1. Load + validate challenge from session
2. `rpOps.authenticate(registrationResponse)` → internally calls `UserCredentialRepository.save()`
3. Issue access token + refresh token; store refresh hash in DB
4. Set refresh token as HttpOnly cookie on response
5. Destroy session
6. Return `TokenResponse` (access token + user; **no** refreshToken in body)

**`POST /webauthn/login-options`** — **no request body**
1. Generate options with empty `allowCredentials` (browser's credential picker)
2. **No user lookup** — prevents email enumeration
3. `authenticatorSelection.userVerification = "required"` (enforce biometrics)
4. Store challenge; return options

**`POST /webauthn/login`**
1. Load challenge; `rpOps.authenticate(authenticationResponse)`
2. Resolve user from `userHandle` in assertion response
3. Issue tokens; set refresh cookie; destroy session
4. Return `TokenResponse`

**`POST /refresh`** — reads cookie, no request body
1. Read `refreshToken` from the `refreshToken` HttpOnly cookie
2. Hash it; look up in `refresh_tokens` table; verify `expiresAt > now()`
3. Rotate: delete old row, insert new row with new hash + new expiry
4. Issue new access token
5. Set new refresh cookie; return `{ accessToken, user }`

**`POST /logout`** — requires valid access token in header
1. Extract `jti` from access token claims (already validated by filter)
2. Insert `jti` into `revoked_tokens` with `expires_at` copied from the token
3. Read `refreshToken` cookie; hash it; delete the row from `refresh_tokens`
4. Clear the refresh cookie (set `maxAge=0`)
5. Return `204 No Content`

---

#### 9. Frontend — Dependencies & Proxy

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

#### 10. Frontend — API Client

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

#### 11. Frontend — Auth Store (replace mock)

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

#### 12. Frontend — Login Page (replace stubs)

**Edit:** `frontend/src/routes/auth/+page.svelte`

State machine: `'idle' | 'register-form' | 'in-progress' | 'error'`

```
[Sign in with Passkey]      ← no email, browser credential picker
[Create account]            ← expands to: email input + display name input + [Register] button
```

**Sign-in flow**: `getLoginOptions()` → `startAuthentication(options)` → `submitLogin(r)` → `setSession(r)` → `goto('/lists')`

**Register flow**: email + displayName form → `getRegisterOptions(email, displayName)` → `startRegistration(options)` → `submitRegistration(r)` → `setSession(r)` → `goto('/lists')`

Error handling:
- `NotAllowedError` (user cancelled): show "Cancelled — try again"
- `ApiError` 429: show "Too many attempts — please wait"
- Generic: show "Something went wrong — try again"

---

#### 13. Frontend — Auth Guard + Layout

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

### Tests

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

#### Frontend Tests
**`auth.ts` (Vitest):** Mock `fetch`. Verify `credentials: 'include'` on all calls; verify `getLoginOptions` takes no parameters; verify `TokenResponse` has no `refreshToken` field.

**`AuthPage.test.ts` (component):** Mock `@simplewebauthn/browser` + `$lib/api/auth`. Test: renders two buttons; "Create account" reveals form; sign-in calls `startAuthentication`; success navigates to `/lists`; 429 shows rate-limit message; `NotAllowedError` shows cancel message.

---

### Security Controls Implemented (from docs/security.md)

| Control | Where in this plan |
|---|---|
| Refresh token HttpOnly/Secure/SameSite=Strict cookie | Cookie helper in controller, all token-issuing endpoints |
| Access token in memory only (not localStorage) | Auth store |
| JWT `jti` + revocation list checked on every request | JwtAuthFilter + RevokedTokenRepository |
| `jti` added to revocation list on logout | `POST /logout` |
| `userVerification: required` on all WebAuthn options | register-options + login-options |
| No email enumeration on login-options | login-options takes no body |
| JWT `iss`, `aud`, `jti`, `nbf` validated | `parseAccessToken` |
| `alg:none` rejected | jjwt explicit-algorithm parser (default) |
| Rate limiting 10/IP/min on `/api/auth/**` | `AuthRateLimitFilter` (Bucket4j) |
| Actuator limited to `health` + `info` | `application.yml` |
| CORS restricted to exact frontend origin | `SecurityConfig.corsConfigurationSource()` |
| `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` | `SecurityConfig.headers {}` |
| Challenge TTL 5 min, invalidated after use | `HttpSessionChallengeRepository` + session destroy |

---

### Critical Files

| File | Action |
|---|---|
| `backend/build.gradle.kts` | Add jjwt 0.13.0 + bucket4j |
| `backend/src/main/resources/application.yml` | Add webauthn, jwt, cors, actuator config |
| `backend/src/main/resources/db/migration/V2__add_auth_tokens.sql` | New — refresh_tokens + revoked_tokens |
| `backend/src/main/kotlin/.../auth/` | New package — all classes above |
| `backend/src/test/kotlin/.../AbstractIntegrationTest.kt` | Reference — all integration tests extend this |
| `frontend/package.json` | Add @simplewebauthn/browser@13.3.0 |
| `frontend/vite.config.ts` | Add dev proxy with credentials |
| `frontend/src/lib/api/auth.ts` | New |
| `frontend/src/lib/stores/auth.svelte.ts` | Replace mock |
| `frontend/src/routes/auth/+page.svelte` | Wire real flows |
| `frontend/src/routes/(app)/+layout.ts` | New — auth guard |
| `frontend/src/routes/(app)/+layout.svelte` | Real user + logout |

### Verification

1. `./gradlew test` — all tests pass including JWT revocation and rate limit tests
2. `docker compose up --build` — Flyway applies V1 + V2, backend starts
3. `bun run dev` → `http://localhost:5173` → redirected to `/auth`
4. Click "Sign in with Passkey" → browser shows credential picker → (first time: empty) → cancel
5. Click "Create account" → enter email + name → passkey prompt → success → `/lists`
6. Reload → stays on `/lists` (cookie restored session)
7. Logout → `/auth`, `revoked_tokens` has the `jti` row, cookie is cleared
8. Reuse old access token after logout → 401
9. `bun run check` — no TypeScript errors
