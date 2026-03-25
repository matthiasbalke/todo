# Security Assessment — OWASP Top 10 (2021)

This document maps the OWASP Top 10 risks to this app's specific stack and architecture, and provides concrete implementation guidance. It is intended to be read alongside `docs/requirements.md` before any backend or frontend code is written, so that security controls are designed in — not bolted on.

**Stack summary:** Kotlin + Spring Boot backend, SvelteKit frontend, PostgreSQL, WebAuthn/passkeys + Google OAuth2 + JWT auth, SSE per-list real-time, Web Push notifications, file attachments (local FS or S3/MinIO), Docker Compose deployment.

---

## A01 – Broken Access Control

**Risk:** The most common OWASP category. A user accesses or modifies data belonging to another user or a list they are not a member of.

### App-specific attack vectors

- **IDOR on list/item IDs** — a VIEWER calls `PUT /api/items/{id}` by guessing or enumerating item IDs
- **Horizontal privilege escalation** — user A accesses list data owned by user B
- **Role bypass** — a VIEWER sends a mutation request that the frontend would normally hide
- **JWT token reuse after logout** — attacker replays a stolen token after the victim logs out

### Mitigations

- **Authorization on every request:** Every backend endpoint must verify the authenticated user is a member of the target list *and* holds a role sufficient for the action before returning or mutating data. Never trust client-supplied IDs alone.
- **Centralize access checks:** Implement a `ListAccessService` that encapsulates membership/role checks. Use Spring Security method security (`@PreAuthorize`) or a consistent service-layer guard — never scatter `if (user.id == ...)` checks across controllers.
- **UUID resource IDs:** Use UUIDs (v4 or v7) for all primary keys exposed in the API (`List.id`, `Item.id`, `User.id`, etc.) to prevent sequential enumeration.
- **Role enforcement matrix:**

  | Endpoint | OWNER | EDITOR | VIEWER |
  |---|---|---|---|
  | Read list/items | ✓ | ✓ | ✓ |
  | Create/update/delete items | ✓ | ✓ | ✗ |
  | Manage list membership | ✓ | ✗ | ✗ |
  | Delete list | ✓ | ✗ | ✗ |

- **JWT revocation:** Maintain a revocation list (Redis or a `revoked_tokens` DB table keyed on `jti` claim) so that logout and passkey removal immediately invalidate issued tokens. Check on every authenticated request.
- **Integration tests:** Write cross-user isolation tests — user A's token must receive 403 on all of user B's list endpoints.

---

## A02 – Cryptographic Failures

**Risk:** Sensitive data exposed in transit or at rest due to weak algorithms, missing TLS, or leaked keys.

### App-specific attack vectors

- JWT secret brute-forced if weak or reused across environments
- HTTP in production exposes JWTs in cookies or headers to network observers
- VAPID private key (Web Push) or OAuth2 client secret committed to source or logged
- Database or MinIO reachable over unencrypted connections

### Mitigations

- **HTTPS everywhere in production:** Terminate TLS at the reverse proxy (nginx/Caddy). Set `Strict-Transport-Security: max-age=31536000; includeSubDomains` on all responses.
- **JWT algorithm and strength:**
  - Prefer RS256 (asymmetric): the backend signs with a private key, and the key can be rotated without redeploying consumers.
  - If HS256 is used, the secret must be at least 256 bits of cryptographically random data (not a human-readable passphrase).
  - Access token expiry: 15 minutes. Refresh token: 7–30 days, stored HttpOnly/Secure/SameSite=Strict cookie. Do not store tokens in `localStorage`.
- **WebAuthn credential storage:** Store authenticator public keys and credential IDs as opaque blobs. Never store or log raw private key material — the private key never leaves the authenticator.
- **Secrets management:** `VAPID_PRIVATE_KEY`, `GOOGLE_CLIENT_SECRET`, `JWT_PRIVATE_KEY`, `DB_PASSWORD`, `MINIO_SECRET_KEY` — all via environment variables or a secrets manager. None may appear in source, `.properties` files checked into git, or application logs.
- **Database and object storage TLS:** Configure `spring.datasource.url` with `sslmode=require` in production. Configure MinIO client with HTTPS endpoint.
- **Sensitive columns at rest:** Consider column-level encryption for future PII fields (e.g. push subscription endpoints) using PostgreSQL `pgcrypto` or application-level encryption.

---

## A03 – Injection

**Risk:** Attacker-controlled input is interpreted as code or commands — SQL, HTML/JS, or filesystem paths.

### App-specific attack vectors

- SQL injection via item names, notes, category names, or search query parameters
- XSS via item content (titles, notes) rendered in SvelteKit templates
- Path traversal in attachment filenames (`../../etc/passwd`)
- Shell injection if attachment processing invokes OS commands

### Mitigations

- **SQL:** Use Spring Data JPA / Hibernate with parameterized queries exclusively. Never concatenate user input into JPQL or native SQL strings. For dynamic search, use `CriteriaBuilder` or a safe query DSL (e.g. Querydsl).
- **XSS — SvelteKit:** SvelteKit escapes `{expression}` bindings by default. Never use `{@html ...}` with user-supplied content. If rich text is ever supported, sanitize server-side with [jsoup](https://jsoup.org/) using a strict allowlist before storing, and strip again before rendering.
- **Attachment filenames:**
  1. On upload, extract only the file extension (after validating it against an allowlist).
  2. Generate a UUID-based storage path: `attachments/{listId}/{uuid}.{ext}`.
  3. Never expose the original filename in the storage layer — store it only as metadata in the DB.
  4. Serve attachments via a signed URL or an authenticated proxy endpoint, never by path.
- **MIME type validation:** Reject uploads whose `Content-Type` does not match an allowlist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`). Additionally, inspect the file's magic bytes server-side (do not trust the client-supplied content type alone).
- **No shell invocation:** Do not invoke OS commands (e.g. `exec()`, `ProcessBuilder`) for attachment processing. Use pure-Java/Kotlin libraries instead.

---

## A04 – Insecure Design

**Risk:** Architectural decisions that create exploitable business logic flaws not fixable by patching implementation bugs.

### App-specific attack vectors

- **Recurrence DoS:** An attacker (or runaway client) creates an item with a recurrence rule that generates millions of child items, exhausting DB storage or backend memory
- **Multi-tenancy leakage:** A query missing a `userId` or `listId` scope returns data from all users
- **Unbounded file uploads:** A user fills disk or object storage by uploading many large files
- **Unrestricted list/item creation:** A single user creates thousands of lists, degrading performance for all

### Mitigations

- **Resource limits (enforced server-side, not just frontend):**
  - Max items per list: 10,000 (configurable via env var)
  - Max lists per user: 500
  - Max attachment size: 10 MB per file
  - Max attachments per item: 10
  - Return HTTP 422 with a clear error message when limits are exceeded
- **Recurrence rules:**
  - Validate `recurrenceRule` against a strict allowlist of supported patterns on the server (e.g. `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY` with optional interval and count).
  - Cap `COUNT` at a reasonable maximum (e.g. 500 future instances).
  - Do not evaluate arbitrary iCal RRULE expressions without validation.
- **Multi-tenancy — query discipline:**
  - All repository methods that return list or item data must accept a `userId` parameter and include it in the `WHERE` clause (or join through `list_membership`).
  - Write integration tests that prove user A's token cannot read user B's data, even with a valid item/list UUID.
- **Rate limiting:** Apply per-user rate limits on write endpoints (create item, create list, upload attachment) to prevent abuse. Use a token-bucket approach via a Spring filter or an API gateway.

---

## A05 – Security Misconfiguration

**Risk:** Secure software running in an insecure configuration, exposing management interfaces, debug endpoints, or overly permissive settings.

### App-specific attack vectors

- Spring Boot Actuator endpoints (`/actuator/env`, `/actuator/heapdump`) accessible without authentication
- CORS configured as `*`, allowing any origin to make credentialed requests
- Docker containers running as root with unnecessary ports exposed
- PostgreSQL or MinIO port exposed on `0.0.0.0` in Docker Compose
- `WEBAUTHN_RP_ID` misconfigured in production (e.g. left as `localhost`)
- Default MinIO credentials (`minioadmin`/`minioadmin`) not changed

### Mitigations

- **Actuator:** Expose only `health` and `info` to the public. All other endpoints (`env`, `beans`, `heapdump`, `threaddump`, `loggers`, `shutdown`) must be disabled or secured behind a management-only network/credential.
  ```yaml
  management.endpoints.web.exposure.include: health,info
  management.endpoint.health.show-details: never
  ```
- **CORS:** Set `allowedOrigins` to the exact frontend origin from an env var. Never use `*` with `allowCredentials: true`.
  ```kotlin
  @Value("\${app.cors.allowed-origins}") val allowedOrigins: String
  ```
- **Security response headers** (set globally in a Spring filter or nginx):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy: default-src 'self'; ...` (tighten iteratively)
- **Docker Compose hardening:**
  - Backend and frontend containers must run as a non-root user (`USER 1001` in Dockerfile).
  - PostgreSQL and MinIO must NOT bind to `0.0.0.0` on the host — use Docker internal networking only.
  - Only the reverse proxy (or frontend) port should be exposed to the host.
  ```yaml
  postgres:
    # no 'ports:' section — internal only
  ```
- **`WEBAUTHN_RP_ID`:** Must exactly match the production domain (e.g. `todo.example.com`). Fail fast on startup if the value is `localhost` and `spring.profiles.active=prod`.
- **Secrets rotation:** Maintain separate PostgreSQL credentials per environment. Document a rotation runbook. Never reuse dev credentials in production.

---

## A06 – Vulnerable and Outdated Components

**Risk:** Known CVEs in dependencies exploited before they are patched.

### App-specific attack vectors

- Spring Boot or Spring Security CVE (RCE, auth bypass) in an unpinned version
- Transitive npm dependency with a known vulnerability (prototype pollution, ReDoS)
- Outdated base Docker image with OS-level vulnerabilities

### Mitigations

- **Dependabot:** Already configured for Gradle, npm (frontend + e2e), Dockerfiles, and GitHub Actions on a weekly schedule — keep it enabled and auto-merge patch updates after CI passes.
- **Gradle dependency verification:** Add `verification-metadata.xml` (`./gradlew --write-verification-metadata sha256`) to detect supply-chain tampering of resolved artifacts.
- **Docker base images:** Pin to specific digest (`FROM eclipse-temurin:25-jre@sha256:...`) in Dockerfiles for reproducible builds. Dependabot will open PRs to update digests.
- **`bun install --frozen-lockfile` in CI:** Use `bun install --frozen-lockfile` (not `bun install`) in CI to enforce the lockfile. Run `bun audit` as a CI gate.
- **Advisories:** Subscribe to:
  - [Spring Security advisories](https://spring.io/security)
  - [SvelteKit / Vite release notes](https://github.com/sveltejs/kit/releases)
  - GitHub Advisory Database (via Dependabot alerts on the repo)

---

## A07 – Identification and Authentication Failures

**Risk:** Weaknesses in the authentication mechanism allow attackers to impersonate users.

### App-specific attack vectors

- WebAuthn challenge reuse or missing RP ID validation, allowing cross-origin credential use
- OAuth2 flow missing `state` parameter, enabling CSRF login attacks
- JWT `alg:none` attack — backend accepts unsigned tokens
- No rate limiting on `/api/auth/*` endpoints, allowing credential stuffing (even with passkeys, an attacker could probe for valid emails)
- Session cookies without `HttpOnly`/`Secure` flags

### Mitigations

- **WebAuthn (Spring Security 6.3 built-in):**
  - Enforce `userVerification: required` in registration and authentication options (requires biometric or PIN on the authenticator).
  - RP ID must exactly match the request origin. Spring Security's WebAuthn support validates this, but verify configuration in tests.
  - Challenges must be stored server-side with a short TTL (e.g. 5 minutes) and invalidated immediately after use (prevent replay).
  - Store `credentialId` and `publicKey` per authenticator, not per user, to support multiple devices.
- **OAuth2 (Spring Security OAuth2 Client):**
  - The `state` parameter is generated and validated automatically by Spring Security — do not bypass it.
  - Restrict `redirect_uri` to a pre-configured allowlist. Reject OAuth callbacks with unknown redirect URIs.
  - Use PKCE (`code_challenge_method=S256`) for the authorization code flow.
- **JWT validation (on every request):**
  - Reject tokens where `alg` is `none` or any unexpected algorithm. Configure the JWT decoder with an explicit algorithm allowlist.
  - Validate `iss`, `aud`, `exp`, `nbf` claims.
  - Validate `jti` against the revocation list (see A01).
- **Rate limiting on auth endpoints:** Max 10 attempts per IP per minute on `/api/auth/login`, `/api/auth/register`, and `/api/auth/webauthn/**`. Return HTTP 429 with `Retry-After`. Use a Spring filter backed by a sliding-window counter (Redis or in-memory for single-node).
- **Session/cookie hardening:**
  - Refresh tokens in `HttpOnly; Secure; SameSite=Strict` cookies.
  - Access tokens short-lived (15 min), passed in `Authorization: Bearer` header by the SvelteKit frontend (not stored in `localStorage` or `sessionStorage`).

---

## A08 – Software and Data Integrity Failures

**Risk:** Code or data modified in the CI/CD pipeline or during deployment without detection.

### App-specific attack vectors

- A malicious dependency injected via Gradle or npm supply chain (typosquatting, compromised package)
- GitHub Actions workflow using a mutable tag (`uses: actions/checkout@v4`) that is silently updated to a malicious commit
- Docker image pulled from an untrusted source or tampered in transit
- Unsafe Java object deserialization of user-supplied data

### Mitigations

- **Gradle:** Enable dependency verification (`verification-metadata.xml`). Use the [Gradle version catalog](https://docs.gradle.org/current/userguide/platforms.html) (`libs.versions.toml`) to centralize and audit dependency declarations.
- **bun:** Use `bun install --frozen-lockfile` (enforces `bun.lockb`). Run `bun audit` in CI. Prefer scoped packages; be alert to typosquatting on well-known package names.
- **GitHub Actions — pin to SHA:** Replace mutable tags with full commit SHAs in all workflow files.
  ```yaml
  # Instead of:
  uses: actions/checkout@v4
  # Use:
  uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
  ```
  Dependabot will keep SHAs up to date.
- **Docker image integrity:** Use digest-pinned base images in Dockerfiles. For your own images, use GHCR with access controls and verify digests in `docker-compose.yml` for production deploys.
- **No Java object deserialization from untrusted input:** All API endpoints accept JSON (Jackson). Never use Java's `ObjectInputStream` with user-supplied data. Ensure no gadget-chain libraries (Commons Collections, Spring's `SerializationUtils` for untrusted input) are reachable via user input paths.

---

## A09 – Security Logging and Monitoring Failures

**Risk:** Attacks succeed undetected because there is no record of suspicious activity.

### App-specific attack vectors

- No audit trail for unauthorized access attempts, making it impossible to detect a compromised account
- Sensitive data (tokens, attachment contents) accidentally written to logs
- No alerting when the same IP receives repeated 401/403 responses

### Mitigations

- **Audit log** (already in the data model — use it):

  | Event | Fields to log |
  |---|---|
  | Passkey registration / removal | userId, credentialId, timestamp, IP |
  | Login success / failure | userId or email, method (passkey/google), timestamp, IP |
  | Logout / token revocation | userId, jti, timestamp |
  | Access denied (403) | userId, resource path, action, timestamp, IP |
  | List membership change | actorUserId, targetUserId, listId, old role, new role |
  | Item create / update / delete | userId, itemId, listId, fields changed (not values) |
  | Attachment upload / delete | userId, itemId, filename (sanitized), size |

- **Log levels:** `WARN` for auth failures and access denials; `ERROR` for unexpected exceptions; `INFO` for successful auth events.
- **Do NOT log:** JWT tokens, OAuth2 authorization codes, VAPID keys, attachment binary contents, full user-supplied text fields, or any other credential/PII beyond the minimum above.
- **Structured logging:** Use JSON log format (Logback + `logstash-logback-encoder`) so logs can be ingested by a log aggregator (Loki, ELK, Datadog, etc.).
- **Alerting:** Configure an alert (or at minimum a daily digest) on:
  - More than 20 consecutive 401/403 responses from the same IP in 5 minutes
  - Any 5xx error spike
  - Audit events for passkey removal from an account (potential account takeover indicator)
- **Log retention:** Retain audit logs for a minimum of 90 days.

---

## A10 – Server-Side Request Forgery (SSRF)

**Risk:** The server is tricked into making requests to internal infrastructure on behalf of an attacker.

### App-specific attack vectors

- If a future "attach from URL" feature fetches a user-supplied URL, an attacker supplies `http://169.254.169.254/` (cloud metadata) or `http://postgres:5432/`
- Web Push: the backend sends push payloads to subscription `endpoint` URLs supplied by browsers — a compromised client could supply an internal URL
- OAuth2 `redirect_uri` pointing to an internal service

### Mitigations

- **No server-side URL fetch for attachments:** Accept only direct file uploads (multipart/form-data). If a future "attach from URL" feature is added, it must go through a strict allowlist/denylist validation before implementation is approved.
- **Web Push endpoint validation:** Before sending a push notification to a subscription endpoint:
  1. Validate the URL scheme is `https`.
  2. Validate the hostname resolves to a known browser push service (FCM, APNs, Mozilla, etc.) — maintain a hostname allowlist or use a DNS check against known push service domains.
  3. Reject endpoints resolving to RFC 1918 addresses, loopback, or link-local ranges.
  - In practice, use the [`java-webpush`](https://github.com/web-push-libs/webpush-java) library which handles the push protocol correctly; add the validation layer around it.
- **OAuth2 `redirect_uri`:** Validate strictly against a pre-configured allowlist in `application.yml`. Spring Security OAuth2 does this automatically for registered clients — do not use wildcard redirect URIs.
- **MinIO/S3 endpoint:** Configure via env var, validated on application startup. Assert the resolved IP is not in a private range before initializing the S3 client. Document that this endpoint must point to an internal/trusted address.
- **Egress filtering** (defense in depth): In production Docker Compose, restrict outbound network access for the backend container to only required destinations (push service endpoints, Google OAuth, MinIO). Use Docker network policies or a firewall rule.

---

## Summary Checklist

Use this checklist at code review time to confirm each control is implemented before the first production deployment.

| # | Control | Where |
|---|---|---|
| A01 | `ListAccessService` called on every list/item endpoint | Backend |
| A01 | UUIDs for all public-facing resource IDs | Backend/DB |
| A01 | JWT revocation list checked on every request | Backend |
| A02 | RS256 or strong HS256 JWT; 15-min access token | Backend |
| A02 | Tokens in HttpOnly/Secure/SameSite=Strict cookies | Backend/Frontend |
| A02 | All secrets in env vars, not in source | Ops |
| A03 | No string-concatenated SQL; parameterized queries only | Backend |
| A03 | No `{@html}` with user content in SvelteKit | Frontend |
| A03 | UUID-based attachment storage paths | Backend |
| A04 | Per-user/per-list resource limits enforced | Backend |
| A04 | Recurrence rule allowlist validation | Backend |
| A05 | Actuator limited to `health` + `info` | Backend config |
| A05 | CORS restricted to exact frontend origin | Backend config |
| A05 | Security headers set on all responses | Backend/nginx |
| A05 | DB and MinIO not exposed outside Docker network | Docker Compose |
| A06 | Dependabot enabled and PRs merged promptly | GitHub |
| A06 | `bun install --frozen-lockfile` + `bun audit` in CI | GitHub Actions |
| A06 | Gradle dependency verification metadata committed | Backend |
| A07 | WebAuthn `userVerification: required` | Backend |
| A07 | OAuth2 state + PKCE validated | Backend |
| A07 | JWT `alg:none` rejected; claims validated | Backend |
| A07 | Rate limiting on auth endpoints | Backend |
| A08 | GitHub Actions pinned to commit SHAs | GitHub Actions |
| A08 | No Java `ObjectInputStream` on user input | Backend |
| A09 | Audit log captures all events in table above | Backend |
| A09 | Tokens/credentials never logged | Backend |
| A09 | Structured JSON logs | Backend |
| A10 | No server-side URL fetch; uploads only | Backend |
| A10 | Web Push endpoint validated against allowlist | Backend |
| A10 | OAuth2 redirect_uri allowlist enforced | Backend config |
