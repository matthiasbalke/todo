# TodoItem: Track Creator

## Overview

Every `TodoItem` stores the user who created it via a `createdByUserId` field (non-nullable FK → User). This enables audit trails, filtering by creator, and surfacing "created by" context in the UI without relying on the separate AuditLog.

## Design decisions

- **Non-nullable**: Every item has a creator. Items created by a recurrence trigger inherit the creator of the original item (same user who created the recurrence rule).
- **Set once, never updated**: `createdByUserId` is immutable after creation. It is not exposed as an editable field in the item form.
- **Stored on the item itself** (not only in AuditLog): allows efficient queries like "show items I created" without joining the audit log table.

## Security considerations

- Only the authenticated user's own `id` is used as `createdByUserId` on the backend — clients cannot supply an arbitrary user ID.
- `createdByUserId` is readable by any list member (VIEWER+), consistent with the rest of the item fields.

## Implementation plan

1. Add `createdByUserId: string` to the `TodoItem` data model in `docs/requirements.md`.
2. Add `createdByUserId: string` to the `TodoItem` TypeScript interface in `frontend/src/lib/mock-data.ts`.
3. Update all mock data items to include `createdByUserId`.
4. Update `ItemForm.svelte` submit handler to pass `createdByUserId` through (preserve existing value on edit; new items will get it from the backend in production).
5. Update `docs/tasks.md` backend task to include `createdByUserId` in the JPA entity.

## Tasks

- [x] Add `createdByUserId` to `TodoItem` model in `docs/requirements.md`
- [x] Add `createdByUserId: string` to `TodoItem` interface in `frontend/src/lib/mock-data.ts`
- [x] Populate `createdByUserId` on all mock data items
- [x] Update `ItemForm.svelte` to thread `createdByUserId` through the submit payload
- [x] Update backend task in `docs/tasks.md` to include `createdByUserId` in the JPA entity
