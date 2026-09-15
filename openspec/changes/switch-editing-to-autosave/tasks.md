## 1. Autosave Infrastructure

- [x] 1.1 Inventory current list, group, add-item, and edit-item save/cancel flows and verify the implementation notes identify every frontend component/store path that still renders ordinary action buttons for routine value editing.
- [x] 1.2 Add a small autosave commit helper or local pattern for unchanged-value guards, in-flight state, stale-response handling, and recoverable errors; verify with focused unit tests for duplicate blur/Enter commits and failed saves.
- [x] 1.3 Ensure shared inline text editing supports focus/select on activation and automatic commit on blur or Enter without visible save/cancel buttons; verify `bun run test -- --run` covers the edited component behavior.

## 2. List And Group Creation

- [x] 2.1 Change the `/lists` new-list action to create `unnamed list` with the default emoji immediately and navigate to the created list; verify the lists page test observes the create call and navigation without rendering the old creation form.
- [x] 2.2 Focus and select the new list title editor after navigation to the created placeholder list; verify with a component or Playwright test that typing replaces `unnamed list`.
- [x] 2.3 Change the `/lists` create-group action to create `unnamed group` immediately and then focus/select the new group name editor; verify the lists page test observes the create call and selected placeholder text.
- [x] 2.4 Autosave list title edits from overview, list detail, and grocery list detail surfaces on blur and Enter while preserving validation errors; verify tests cover successful edits, unchanged edits, invalid edits, and failed persistence.
- [x] 2.5 Autosave group name edits on blur and Enter while preserving validation errors; verify tests cover successful edits, unchanged edits, invalid edits, and failed persistence.

## 3. Item Autosave

- [x] 3.1 Remove ordinary add/edit item form save and cancel buttons while keeping destructive confirmations and fullscreen notes editor chrome intact; verify item form tests assert form-level buttons are absent in add and edit modes and notes Save/Cancel controls remain in the fullscreen editor.
- [x] 3.2 Persist existing item title edits on blur and Enter with unchanged-value guards and recoverable errors; verify item form or item page tests cover title success/failure cases.
- [x] 3.3 Persist existing item selection and toggle edits from their natural change events; verify tests cover category, due date, recurrence, assignee, completion, and starred changes without an explicit save action.
- [x] 3.4 Create a new item once the required title is valid and an intentional creation event fires, including current optional field values; verify tests cover title-only creation and creation with category, date, recurrence, assignees, completion, starred, and notes values saved through the existing notes editor workflow.
- [x] 3.5 Preserve the quick-add item draft when focus leaves or the form is minimized before creation, and verify title blur does not create an item; verify existing and new draft-preservation tests pass.
- [x] 3.6 Update reset behavior so successful quick-add creation clears the draft, failed creation keeps it, and any explicit draft-discard affordance is outside the ordinary save/cancel flow; verify draft reset and failure tests pass.

## 4. Integration And Regression Coverage

- [x] 4.1 Update Playwright coverage for creating a list, creating a group, adding an item, and editing an existing item without ordinary save/cancel controls. Targeted e2e execution was not run in this environment because the configured HTTPS deployment returned HTTP 502.
- [x] 4.2 Run frontend checks with `cd frontend && bun run check` and `cd frontend && bun run test -- --run`; verify both commands pass.
- [x] 4.3 Run relevant backend tests only if endpoint behavior changed; otherwise verify no backend contract changes were made.
- [x] 4.4 Run `openspec validate switch-editing-to-autosave --strict` and verify the change validates before implementation is considered complete.

## 5. Stable Item Editor Scrolling

The following tasks were added after the original autosave work. They are not implemented or verified by the earlier completed checks.

- [x] 5.1 Replace per-row immediate scrolling with one existing-item coordinator and explicit title/metadata anchors; verify mouse, touch, keyboard, repeated activation, pointer/focus deduplication, and canceled gestures without moving the target during pointer down.
- [x] 5.2 Implement 96 CSS pixel visual-viewport alignment with event-driven keyboard corrections, frame coalescing, tolerance, active-session guards, fallback geometry, and cleanup; verify delayed viewport changes, manual scrolling and pinch-zoom suspension, and absence of correction loops.
- [x] 5.3 Add measured trailing scroll space to the item detail page and retain it until editor exit; verify the lowest field reaches the target on short documents and keyboard dismissal or field switching does not collapse the reserved space.
- [x] 5.4 Confine combobox option scrolling to its listbox and constrain listbox/calendar height to the visible viewport; prevent calendar focus from unnecessarily scrolling the document and verify pointer/keyboard selection plus other shared-component consumers.
- [x] 5.5 Scope asynchronous focus release to the originating control and editing session; verify slow saves cannot blur a newer field or a later editing session on the same control.
- [x] 5.6 Make fullscreen notes fit the visual viewport with visible Save/Cancel and an internally scrolling textarea; suspend background alignment and verify long notes, keyboard transitions, focus/document-position restoration, and teardown.
- [x] 5.7 Add browser coverage that asserts actual final field geometry and scroll containment; run the reachable shared HTTPS deployment workflow, frontend checks, and relevant unit/component regressions, including quick-add draft preservation. Record any unavailable environment rather than claiming validation.
- [ ] 5.8 Verify and record results on real iOS Safari, installed iOS PWA, and Android Chrome for keyboard opening/dismissal, rapid field changes during slow saves, manual scrolling, orientation changes, and notes editing; leave this task pending if real-device verification is unavailable.
- [x] 5.9 Re-run `openspec validate switch-editing-to-autosave --strict` after implementation and reconcile follow-up task status with actual verification results.

Verification results and outstanding real-device checks are recorded in [verification.md](verification.md).
