## Why

Email addresses are the account's primary identifier, but current lookup and duplicate checks can treat differently-cased forms of the same address as different accounts. This breaks member invites by email and risks duplicate identities, inconsistent admin/profile validation, and missed passkey account lookup.

## What Changes

- Normalize email equality, uniqueness, and lookup behavior so comparisons use trimmed, case-insensitive values across account creation, setup, profile updates, admin user edits, passkey user lookup, member invites, and future OAuth email linking.
- Store email addresses trimmed but otherwise as typed by the user, while ensuring all matching and duplicate detection uses a canonical trimmed, lower-case comparison form.
- Keep frontend member suggestion filtering case-insensitive so already-loaded members are not suggested when casing differs.
- Add backend and frontend unit/integration coverage for every email comparison path touched by the change.

## Capabilities

### New Capabilities
- `account-email-identity`: Defines account email identity semantics, including case-insensitive uniqueness and lookup behavior.

### Modified Capabilities
- `list-member-management`: Member invite email matching and current-list suggestion exclusion must be case-insensitive.
- `admin-area`: Admin account email edits must reject duplicate emails regardless of casing.

## Impact

- Backend auth/account/list persistence and services that call `UserRepository.findByEmail` or duplicate-email checks.
- Database uniqueness semantics for existing and future user email records.
- WebAuthn username lookup by email and future Google OAuth email linking through the same email identity contract.
- Frontend `MembersDialog` suggestion filtering.
- Tests in backend auth/list/admin areas and frontend member management components.
