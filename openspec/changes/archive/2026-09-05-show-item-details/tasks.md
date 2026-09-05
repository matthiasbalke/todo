## 1. Backend Audit Contract

- [x] 1.1 Add Flyway migrations for nullable `todo_items.updated_by_user_id` without a default or backfill, and a separate table-rebuild migration that orders `sort_order` before audit users and `updated_by_user_id` behind `created_at`.
- [x] 1.2 Add `updatedByUserId` to the `TodoItem` entity, item DTOs, SSE item payloads, and frontend API item DTO types.
- [x] 1.3 Set `updatedByUserId` to the acting user on item create and every item mutation path that updates `updatedAt`, including edit, done toggle, starred toggle, order update, and bulk reorder.
- [x] 1.4 Add or update backend integration tests proving item responses include `createdByUserId`, `updatedByUserId`, `createdAt`, and `updatedAt`, and that update operations record the updating user.

## 2. Frontend Detail Display

- [x] 2.1 Extend the frontend `TodoItem` model and item store mapping to retain `updatedAt` and `updatedByUserId`.
- [x] 2.2 Render centered `updated by` and `created by` lines below the note field in editable mode, currently `ItemForm.svelte`.
- [x] 2.3 Render centered `updated by` and `created by` lines below the notes section in read-only mode, currently `ItemDetails.svelte`.
- [x] 2.4 Resolve audit user IDs against the provided list users and display only the user's display name or `Deleted user`; do not display raw user IDs.
- [x] 2.5 Format audit timestamps as `<weekday> <day>. <month> <year> at <hour>:<minute>` in both item detail modes.

## 3. Verification

- [x] 3.1 Add focused frontend component tests for visible audit rows in edit and read-only modes, row order below notes, date/time formatting, `Deleted user` fallback, and absence of raw user IDs.
- [x] 3.2 Run relevant backend tests for item DTO/update behavior.
- [x] 3.3 Run relevant frontend checks/tests for item detail rendering and TypeScript model consistency.
