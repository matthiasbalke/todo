## Context

User email is stored as text with a unique constraint and is used as the primary account identifier for registration, setup, WebAuthn lookup, member invites, profile updates, and admin edits. Future Google OAuth email linking should consume the same email identity lookup contract when it is implemented. PostgreSQL text uniqueness is case-sensitive, and repository methods currently expose exact-case lookup names such as `findByEmail`.

The frontend already filters loaded members out of member suggestions defensively, but that comparison should use a deterministic case-insensitive normalization rather than locale-sensitive casing.

## Goals / Non-Goals

**Goals:**
- Make email identity comparisons use `trim().lowercase()` semantics across backend account lookup, duplicate checks, and member invites.
- Enforce the same rule at the database layer so concurrent writes cannot create case-only duplicate accounts.
- Store email addresses trimmed but otherwise as submitted for display/profile purposes, including when a user or admin changes only the casing of the same account's email.
- Cover every changed email comparison path with targeted tests.

**Non-Goals:**
- Full RFC email canonicalization, provider-specific alias handling, Unicode normalization, or Gmail-style dot/plus handling.
- Changing API payload shapes, exposing an additional canonical email field, or implementing Google OAuth.
- Bulk repairing arbitrary historical duplicate accounts in application code.

## Decisions

1. Use trimmed lower-case comparison as the canonical equality rule.

   Email equality checks will compare `lower(trim(email))` values. Stored emails will be trimmed before persistence, but casing will be preserved for display. This matches typical application expectations and avoids provider-specific behavior. Alternative considered: storing all emails lowercased. That would simplify comparison but would change displayed email casing and would not allow the profile/admin "change only casing" behavior.

2. Centralize case-insensitive lookup in `UserRepository`.

   Replace exact identity lookup usage with repository methods whose names and queries make trimmed, case-insensitive behavior explicit, such as explicit `lower(trim(...))` queries. Derived `IgnoreCase` methods may be insufficient because the contract also trims request and stored values. Call sites should stop using exact-case `findByEmail` for account identity decisions. Future OAuth email linking should use the same repository method rather than adding provider-specific exact matching.

3. Add a database-level unique index on `lower(trim(email))`.

   Application checks alone are not enough under concurrent registration/setup/profile/admin writes. A Flyway migration should add a unique functional index for `lower(trim(email))`. The existing unique email constraint can remain as a stricter exact-value guard, but it does not replace the functional index.

4. Trim emails before persistence at API boundaries.

   Implementation should preserve existing trimming and add it where missing, then store the trimmed value without changing casing. This avoids treating leading/trailing whitespace as part of identity without adding broad validation changes.

5. Use non-locale casing in frontend suggestion filtering.

   Member suggestion filtering should normalize with a small helper based on `trim().toLowerCase()`. `toLocaleLowerCase()` is unnecessary for email identity and can produce locale-sensitive surprises.

## Risks / Trade-offs

- [Existing production data contains case-only or whitespace-only duplicate emails] -> The functional unique index migration will fail, which is preferable to silently choosing the wrong identity. Resolve duplicates manually before applying the migration.
- [Database and application comparison rules drift] -> Keep repository lookup tests and migration-backed integration tests in the backend suite.
- [Some providers treat local-part casing as significant] -> The product uses email as a human account identifier, where case-insensitive behavior is the expected UX and matches the user's requirement.
- [Changing repository method names touches several auth paths] -> Use targeted integration tests for registration/setup/profile/admin/member invite and a unit test for WebAuthn lookup.

## Migration Plan

1. Add the functional unique index on `lower(trim(email))` in a Flyway migration.
2. Update repository methods and all identity call sites to use case-insensitive lookup/duplicate checks.
3. Update frontend member suggestion filtering normalization.
4. Run targeted backend auth/list/admin tests, frontend member dialog tests, and the normal frontend type-check.
5. Rollback, if needed, by reverting application changes and dropping the new functional index in a follow-up migration before accepting new case-only duplicate accounts.
