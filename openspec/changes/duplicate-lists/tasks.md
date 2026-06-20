## 1. Backend Duplication API

- [ ] 1.1 Add repository helpers needed to load source list categories, items, memberships, assignments, and the requesting user's accessible list names.
- [ ] 1.2 Add `ListService.duplicateList(listId, userId)` with owner authorization and one transactional deep-copy operation.
- [ ] 1.3 Implement next-suffix name generation using the requesting user's accessible list names.
- [ ] 1.4 Copy list metadata, memberships, group assignment for the requesting user, categories, items, item assignments, category references, and in-list parent item references with new list/category/item IDs.
- [ ] 1.5 Add `POST /api/lists/{id}/duplicate` to `ListController` returning the duplicated list DTO with the current user's role.

## 2. Frontend Integration

- [ ] 2.1 Add a `duplicateList(id)` API client function and response typing in `frontend/src/lib/api/lists.ts`.
- [ ] 2.2 Add a list store duplicate action that calls the API, inserts the returned list into local state, and returns it to callers.
- [ ] 2.3 Extend centralized list capabilities with list duplication for owners only.
- [ ] 2.4 Add a `Duplicate list` menu item directly above `Delete list` on the list page, with pending-state handling, friendly error reporting, and navigation to the duplicated list.

## 3. Backend Tests

- [ ] 3.1 Add integration coverage for owner duplication returning a new owner-owned list with the next available suffix.
- [ ] 3.2 Add integration coverage that editors, viewers, and non-members cannot duplicate a list.
- [ ] 3.3 Add integration coverage that categories, items, recurrence rules, done/starred state, due dates, sort order, created-by user, assignments, and in-list parent links are copied to new IDs.
- [ ] 3.4 Add integration coverage for suffix incrementation when ` (1)` and later copies already exist.

## 4. Frontend Tests

- [ ] 4.1 Add unit coverage for the list API/store duplicate path and local state insertion.
- [ ] 4.2 Add capability tests proving only owners receive list duplication capability.
- [ ] 4.3 Add list page component coverage that owners see `Duplicate list` above `Delete list`, non-owners do not, success navigates to the copy, and failure reports an error.

## 5. Validation

- [ ] 5.1 Run targeted backend tests for list duplication.
- [ ] 5.2 Run frontend type-check and targeted Vitest coverage for the updated store, capability, and list page tests.
- [ ] 5.3 Run `openspec status --change "duplicate-lists"` and confirm the change is apply-ready.
