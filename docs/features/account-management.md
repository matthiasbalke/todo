# Plan: Account Management

## Context

Users need a way to manage their profile (display name, email), their registered passkeys
(list, add for a new device, remove), and delete their account. Account management is
accessed via a new "Account" entry in the existing user menu (top-right in `(app)/+layout.svelte`),
above "Log out". After account deletion the app shows a static "/deleted" page (outside the
protected app group).

---

## Critical files

| File | Role |
|---|---|
| `backend/src/main/.../auth/AuthController.kt` | Existing WebAuthn patterns to replicate |
| `backend/src/main/.../auth/User.kt` | Entity — needs `email`/`displayName` → `var` |
| `backend/src/main/.../auth/WebAuthnCredential.kt` | Entity — needs `label: String?` |
| `backend/src/main/.../auth/WebAuthnCredentialRepository.kt` | Add ownership-aware finder |
| `backend/src/main/.../auth/UserRepository.kt` | Add email-uniqueness check |
| `backend/src/main/resources/db/migration/` | New V5 migration |
| `frontend/src/routes/(app)/+layout.svelte` | Add "Account" menu item |
| `frontend/src/lib/stores/auth.svelte.ts` | Add `updateCurrentUser()` |
| `frontend/src/lib/api/auth.ts` | Existing API patterns to follow |
| `frontend/src/lib/api/authedClient.ts` | Used for all authenticated calls |

---

## Design decisions

- **No new controller for passkeys** — all account endpoints live in a single `UserController`
  (`GET/PUT /api/users/me`, passkey sub-resource under `/api/users/me/passkeys`, deletion under
  `/api/users/me`). Keeps routing predictable.
- **Passkey label** — nullable `label VARCHAR(255)` added to `webauthn_credentials`. Users may
  name a passkey when adding it; existing passkeys display their creation date as fallback.
- **Add-passkey flow** — reuses Spring Security's `webAuthnRelyingPartyOperations` exactly like
  `AuthController`, but requires an authenticated user. Two new endpoints:
  `POST /api/users/me/passkeys/register-options` and `POST /api/users/me/passkeys`.
- **Last-login-method guard** — `DELETE /api/users/me/passkeys/{id}` returns `409 Conflict`
  with `code: LAST_PASSKEY` if the user has only one credential (OAuth not implemented).
- **Account deletion cascade** — all FKs already have `ON DELETE CASCADE` or `ON DELETE SET NULL`
  in the schema. Service only needs to: (1) find & delete sole-owned lists explicitly, (2) delete
  the user row (everything else cascades).
- **Deleted page at `/deleted`** — placed in the root `routes/` group (not `(app)/`), so it is
  accessible after the session is cleared.
- **Inline display-name edit** — same pattern as list-title inline edit: click to show input,
  blur/Enter saves, Escape cancels.
- **Email edit** — shown as a standard form field with an explicit "Save" button (email changes
  are less frequent and deserve a deliberate action).

---

## Security considerations

- All `/api/users/me/**` endpoints require a valid JWT (handled by `JwtAuthenticationFilter`).
- Email uniqueness checked via `UserRepository.existsByEmailAndIdNot(email, userId)` before
  persisting — returns the same response shape regardless of collision (no enumeration).
- Passkey deletion guard prevents locking users out.
- Account deletion requires a confirmation step on the frontend (preview + explicit confirm).
- Rate limiting: auth endpoints already rate-limited by `AuthRateLimitFilter`. The
  add-passkey flow (`/api/users/me/passkeys/register-options`) is not under `/api/auth/**`
  but is protected by JWT auth; brute-force is not a practical concern here.

---

## Implementation plan

### 1 — Backend: Migration

Create `V5__add_passkey_label.sql`:
```sql
ALTER TABLE webauthn_credentials ADD COLUMN label VARCHAR(255);
```

### 2 — Backend: Entity updates

**`User.kt`** — change `email` and `displayName` from `val` to `var`:
```kotlin
@Column(nullable = false, unique = true) var email: String,
@Column(name = "display_name", nullable = false) var displayName: String,
```

**`WebAuthnCredential.kt`** — add nullable label field:
```kotlin
@Column(nullable = true) var label: String? = null,
```

### 3 — Backend: Repository additions

**`UserRepository`** — add:
```kotlin
fun existsByEmailAndIdNot(email: String, id: UUID): Boolean
```

**`WebAuthnCredentialRepository`** — add:
```kotlin
fun findByIdAndUserId(id: UUID, userId: UUID): WebAuthnCredential?
fun countByUserId(userId: UUID): Long
```

**`ListMembershipRepository`** — add (for deletion preview):
```kotlin
fun findAllByUserId(userId: UUID): List<ListMembership>
```

**`ListRepository`** — add (for finding sole-owned lists):
```kotlin
fun deleteById(id: UUID)  // already in JpaRepository; verify usable
```
(Use existing `ListMembershipRepository` to find candidate lists and check for other owners)

### 4 — Backend: UserController + AccountService

Create `auth/UserController.kt` with:

```
GET    /api/users/me                           → UserProfileDto
PUT    /api/users/me                           → UserProfileDto  (400 on blank displayName, 409 on dup email)
GET    /api/users/me/passkeys                  → List<PasskeyDto>
POST   /api/users/me/passkeys/register-options → PublicKeyCredentialCreationOptionsJSON  (requires JWT)
POST   /api/users/me/passkeys                  → PasskeyDto  (body: { credential, label? })
DELETE /api/users/me/passkeys/{id}             → 204  (409 LAST_PASSKEY if only one)
GET    /api/users/me/deletion-preview          → DeletionPreviewDto
DELETE /api/users/me                           → 204  (clears session cookie too)
```

DTOs:
```kotlin
data class UserProfileDto(val id: UUID, val email: String, val displayName: String)
data class UpdateProfileRequest(val displayName: String, val email: String)
data class PasskeyDto(val id: UUID, val label: String?, val createdAt: Instant)
data class AddPasskeyRequest(val credential: Any /*RegistrationResponseJSON*/, val label: String?)
data class DeletionPreviewDto(val listsToDelete: List<ListNameDto>, val listsToLeave: List<ListNameDto>)
data class ListNameDto(val id: UUID, val name: String)
```

Create `auth/AccountService.kt` to contain:
- `updateProfile(userId, request)` — updates User, checks email uniqueness
- `getPasskeys(userId)` — returns all credentials
- `addPasskeyOptions(userId, httpSession)` — calls `webAuthnRelyingPartyOperations.beginPublicKeyCredentialRegistration()`
- `addPasskey(userId, credential, label, httpSession)` — calls finish, saves credential with label
- `removePasskey(userId, passkeyId)` — checks count ≥ 2, then deletes
- `getDeletionPreview(userId)` — identifies sole-owned lists vs shared memberships
- `deleteAccount(userId, httpSession)` — deletes sole-owned lists, deletes user (cascades rest), invalidates session cookie

### 5 — Backend: Integration tests

Create `UserControllerTest` (extends `AbstractIntegrationTest`):
- `GET /api/users/me` returns profile for authenticated user
- `PUT /api/users/me` updates displayName; updates email; rejects blank displayName; rejects duplicate email
- `GET /api/users/me/passkeys` lists credentials
- `DELETE /api/users/me/passkeys/{id}` removes credential; returns 409 when last credential
- `GET /api/users/me/deletion-preview` returns correct split of sole-owned vs shared
- `DELETE /api/users/me` deletes sole-owned list, removes from shared, user record gone

### 6 — Frontend: API client

Create `src/lib/api/users.ts`:
```typescript
export interface UserProfileDto { id: string; email: string; displayName: string }
export interface PasskeyDto { id: string; label: string | null; createdAt: string }
export interface DeletionPreviewDto {
  listsToDelete: { id: string; name: string }[];
  listsToLeave:  { id: string; name: string }[];
}

getMe(): Promise<UserProfileDto>
updateMe(req: { displayName: string; email: string }): Promise<UserProfileDto>
getPasskeys(): Promise<PasskeyDto[]>
getAddPasskeyOptions(): Promise<PublicKeyCredentialCreationOptionsJSON>
submitAddPasskey(credential: RegistrationResponseJSON, label?: string): Promise<PasskeyDto>
deletePasskey(id: string): Promise<void>
getDeletionPreview(): Promise<DeletionPreviewDto>
deleteAccount(): Promise<void>
```

All use `authedFetch`.

### 7 — Frontend: Auth store update

Add to `src/lib/stores/auth.svelte.ts`:
```ts
export function updateCurrentUser(partial: Partial<AuthUser>): void {
  if (currentUser) currentUser = { ...currentUser, ...partial };
}
```

### 8 — Frontend: User menu

In `src/routes/(app)/+layout.svelte`, add above "Log out":
```svelte
<a href="/account" onclick={() => (userMenuOpen = false)}
   class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
  Account
</a>
<div class="border-t border-gray-100 my-1"></div>
```

### 9 — Frontend: Account page

Create `src/routes/(app)/account/+page.ts` (disables SSR, loads profile + passkeys):
```ts
export const ssr = false;
export async function load() {
  const [profile, passkeys] = await Promise.all([getMe(), getPasskeys()]);
  return { profile, passkeys };
}
```

Create `src/routes/(app)/account/+page.svelte` with three sections:

**Profile section:**
- `displayName` — inline editable (click → input, blur/Enter saves, Escape cancels) — calls `updateMe`, then `updateCurrentUser`
- `email` — text field + "Save" button — calls `updateMe`
- Shows success/error feedback inline (not `alert()`)

**Security section:**
- List of passkeys: label (or "Passkey" if null) + creation date
- Each row has a "Remove" button; disabled + tooltip "Can't remove last passkey" when only one
- "Add passkey for this device" button → prompts for optional label in an inline form → calls `getAddPasskeyOptions()` → `startRegistration()` → `submitAddPasskey()` → refreshes list

**Danger zone:**
- "Delete my account" red button → opens inline confirmation panel
- Confirmation panel shows preview (listsToDelete, listsToLeave), "Confirm deletion" red button, "Cancel" link
- On confirm: calls `deleteAccount()`, clears session, navigates to `/deleted`

### 10 — Frontend: Deleted page

Create `src/routes/deleted/+page.svelte`:
- Static page, no auth required
- Message: "Your account has been deleted." with a link back to `/auth` to start fresh

---

## Verification

```bash
# Backend tests
cd backend && ./gradlew test --tests "*.UserControllerTest"

# Frontend type check + unit tests
cd frontend && bun run check && bun run test
```

Manual smoke test:
- Open user menu → "Account" appears above "Log out"
- Click display name → becomes inline input; blur saves; header updates
- Change email → save; reload → new email shown
- Add passkey for new device → label prompt → WebAuthn ceremony → passkey appears in list
- Remove non-last passkey → removed from list
- Attempt to remove last passkey → button disabled
- Delete account → preview screen lists correct lists → confirm → redirected to `/deleted`
