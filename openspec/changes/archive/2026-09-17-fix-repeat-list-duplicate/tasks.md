## 1. Frontend State Fix

- [x] 1.1 Update the list page duplicate handler to ignore repeat activations while duplication is already pending and verify the `Duplicate list` menu item remains disabled during an unresolved duplicate request.
- [x] 1.2 Reset duplicate pending state after a successful duplicate request and navigation request, and verify the destination list page shows an enabled `Duplicate list` action without leaving and reopening the list.

## 2. Regression Coverage

- [x] 2.1 Add or update `frontend/src/routes/(app)/lists/[id]/list-page.test.ts` coverage for duplicating a list, arriving on the duplicated list route, and immediately seeing `Duplicate list` enabled.
- [x] 2.2 Run the focused frontend test file with `cd frontend && bun run test -- --run 'src/routes/(app)/lists/[id]/list-page.test.ts'` and verify it passes.
