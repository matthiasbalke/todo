## 1. Autosave Infrastructure

- [ ] 1.1 Inventory current list, group, add-item, and edit-item save/cancel flows and verify the implementation notes identify every frontend component/store path that still renders ordinary action buttons for routine value editing.
- [ ] 1.2 Add a small autosave commit helper or local pattern for unchanged-value guards, in-flight state, stale-response handling, and recoverable errors; verify with focused unit tests for duplicate blur/Enter commits and failed saves.
- [ ] 1.3 Ensure shared inline text editing supports focus/select on activation and automatic commit on blur or Enter without visible save/cancel buttons; verify `bun run test -- --run` covers the edited component behavior.

## 2. List And Group Creation

- [ ] 2.1 Change the `/lists` new-list action to create `unnamed list` with the default emoji immediately and navigate to the created list; verify the lists page test observes the create call and navigation without rendering the old creation form.
- [ ] 2.2 Focus and select the new list title editor after navigation to the created placeholder list; verify with a component or Playwright test that typing replaces `unnamed list`.
- [ ] 2.3 Change the `/lists` create-group action to create `unnamed group` immediately and then focus/select the new group name editor; verify the lists page test observes the create call and selected placeholder text.
- [ ] 2.4 Autosave list title edits from overview, list detail, and grocery list detail surfaces on blur and Enter while preserving validation errors; verify tests cover successful edits, unchanged edits, invalid edits, and failed persistence.
- [ ] 2.5 Autosave group name edits on blur and Enter while preserving validation errors; verify tests cover successful edits, unchanged edits, invalid edits, and failed persistence.

## 3. Item Autosave

- [ ] 3.1 Remove ordinary add/edit item form save and cancel buttons while keeping destructive confirmations and fullscreen notes editor chrome intact; verify item form tests assert form-level buttons are absent in add and edit modes and notes Save/Cancel controls remain in the fullscreen editor.
- [ ] 3.2 Persist existing item title edits on blur and Enter with unchanged-value guards and recoverable errors; verify item form or item page tests cover title success/failure cases.
- [ ] 3.3 Persist existing item selection and toggle edits from their natural change events; verify tests cover category, due date, recurrence, assignee, completion, and starred changes without an explicit save action.
- [ ] 3.4 Create a new item once the required title is valid and the creation commit event fires, including current optional field values; verify tests cover title-only creation and creation with category, date, recurrence, assignees, completion, starred, and notes values saved through the existing notes editor workflow.
- [ ] 3.5 Preserve the quick-add item draft when focus leaves or the form is minimized before creation, while updating reset behavior so successful creation clears the draft, failed creation keeps it, and any explicit draft-discard affordance is outside the ordinary save/cancel flow; verify existing and new draft-preservation tests pass.
- [ ] 3.6 Verify category management remains unchanged except for item category selection participating in item autosave; verify category configuration regression tests still pass.

## 4. Integration And Regression Coverage

- [ ] 4.1 Update Playwright coverage for creating a list, creating a group, adding an item, and editing an existing item without ordinary save/cancel controls; verify the targeted e2e specs pass against the configured HTTPS deployment.
- [ ] 4.2 Run frontend checks with `cd frontend && bun run check` and `cd frontend && bun run test -- --run`; verify both commands pass.
- [ ] 4.3 Run relevant backend tests only if endpoint behavior changed; otherwise verify no backend contract changes were made.
- [ ] 4.4 Run `openspec validate switch-editing-to-autosave --strict` and verify the change validates before implementation is considered complete.
