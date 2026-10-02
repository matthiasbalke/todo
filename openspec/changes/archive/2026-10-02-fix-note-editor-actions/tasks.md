# Tasks

## 1. Restore fullscreen note editor actions

- [x] 1.1 Mount the `ItemForm` fullscreen notes editor outside the application scroll container using the established portal cleanup pattern, and verify its Cancel/back, Notes title, and Save header render above the global application chrome.
- [x] 1.2 Extend `ItemForm` tests for the portaled editor header and save, cancel, Escape, and focus-return lifecycle; verify with `cd frontend && bun run test -- --run src/lib/components/ItemForm.test.ts`.
