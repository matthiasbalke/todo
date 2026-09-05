## Context

GitHub issue 118 asks the item detail page to display two read-only audit rows below the note field: the last update timestamp and user, followed by the creation timestamp and user. The rows must appear for both editable users, who currently see `ItemForm.svelte`, and read-only users, who currently see `ItemDetails.svelte`.

The frontend item page switches between `ItemForm.svelte` for owners/editors and `ItemDetails.svelte` for viewers. Both components receive the selected item and list users, and both have a note field/section where audit metadata can be placed. The item API currently exposes `createdByUserId`, `createdAt`, and `updatedAt`, but it does not expose an `updatedByUserId`. The backend `todo_items` entity persists `created_by_user_id`, `created_at`, and `updated_at`; update operations only refresh `updated_at`.

## Goals / Non-Goals

**Goals:**
- Display created and updated audit metadata below the note field in both editable and read-only item detail modes.
- Resolve user IDs to list member display names when available, without showing raw user IDs in the UI.
- Add the missing last-updated-by data to item persistence, API responses, SSE payloads, and frontend item models.
- Preserve existing item create/update behavior and authorization.

**Non-Goals:**
- Introduce a full item audit history or audit log timeline.
- Add editing controls for audit metadata.
- Change how list membership or item authorization works.
- Localize the date/time format beyond the requested compact audit sentence display.

## Decisions

- Persist `updatedByUserId` on items.
  - Rationale: The requested `updated by` value cannot be derived from the current API contract. Storing the actor alongside `updatedAt` makes item detail, list refreshes, and SSE updates consistent.
  - Alternative considered: Display only `updatedAt` and omit the user. This would not satisfy the issue.

- Do not backfill existing `updated_by_user_id` values from `created_by_user_id`.
  - Rationale: Existing rows predate last-updater tracking, and the creator is not necessarily the last updater. Leaving the field null is more accurate than inventing historical update actors.
  - Alternative considered: Backfill from `created_by_user_id`. That would populate more rows immediately, but it can present incorrect update attribution.

- Update all item mutation paths that change `updatedAt` to also set `updatedByUserId`.
  - Rationale: The visible update row must reflect the actor for regular edits, done/starred toggles, order changes, and bulk reorder operations.
  - Alternative considered: Track only full item edits. That would make the displayed last updater stale after other supported item mutations.

- Format centered audit lines in the frontend item detail/edit components.
  - Rationale: Existing API timestamps are ISO values, and presentation formatting belongs in the UI layer. The item page already has the user list needed to resolve names, and the frontend already has the current user's persisted timezone preference.
  - Alternative considered: Format dates in the backend. That would make API responses less reusable and couple them to one UI locale.

- Display only user display names or `Deleted user` for audit actors.
  - Rationale: After this change, unresolved audit actors should normally represent users whose accounts were deleted. The household UI should remain readable and should not expose implementation IDs when a historical actor is absent from the visible member list.
  - Alternative considered: Fall back to the raw user ID. That is noisy, not meaningful for normal users, and exposes an internal identifier.

- Keep audit user database fields nullable rather than forcing `NOT NULL` or adding defaults.
  - Rationale: The current schema already allows missing `created_by_user_id`, and account deletion can remove user rows. Nullable audit actors keep the migration additive and avoid a larger user-deletion redesign.
  - Alternative considered: Make `created_by_user_id` and `updated_by_user_id` non-null with a permanent sentinel user. That is stricter, but it complicates account deletion, user management filtering, and historical-data migration for limited product value.

- Keep audit metadata read-only even in edit mode.
  - Rationale: Editable users need visibility into the metadata without being able to alter it. Existing create/update request DTOs should remain user-editable fields only.
  - Alternative considered: Include hidden audit fields in form state. That increases the risk of accidentally sending or trusting client-supplied audit values.

## Risks / Trade-offs

- Existing rows may have null `createdByUserId` → Show `Deleted user` for missing user data.
- Existing rows will have null `updatedByUserId` until changed after this feature ships → Show `Deleted user` for the updater.
- List user data may not include the historical actor anymore → Show `Deleted user` rather than hiding the row or exposing the raw user ID.
- Adding a nullable database column touches backend persistence and DTOs for a small UI request → Keep the migration additive and avoid changing request payloads.
