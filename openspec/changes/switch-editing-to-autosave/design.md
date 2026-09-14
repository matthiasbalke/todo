## Context

See proposal.md for motivation. The frontend currently has a mixed model: category management already persists ordinary edits without save/discard buttons, while list creation, group creation, and item forms still expose explicit action buttons. `ItemForm` owns new-item draft preservation and existing-item submission, and the list overview owns list/group creation plus navigation after list creation.

The existing backend endpoints already support create/update operations for lists, groups, and items. Backend authorization must remain the source of truth; this change should primarily reshape frontend commit timing and recovery behavior.

## Goals / Non-Goals

**Goals:**

- Use predictable autosave commit events: ordinary text fields commit on blur and Enter, selection controls commit when a valid selection changes, and toggle controls commit immediately.
- Create placeholder lists and groups immediately, then focus/select their placeholder names so the first typed text replaces them.
- Cover routine list organization editors that still use explicit controls: list titles from overview/detail/grocery views and list group names.
- Keep the quick-add item form's existing draft preservation when focus leaves or the form is minimized before creation.
- Keep the existing fullscreen notes editor workflow, including its Save and Cancel controls, because it is a field-specific long-form editor rather than the ordinary item form save/cancel flow.
- Keep failed saves recoverable by preserving the user's current draft and surfacing the error near the affected editor.
- Keep API writes idempotent from the user's perspective by avoiding duplicate commits for unchanged values.
- Preserve existing role-based visibility and backend authorization checks.

**Non-Goals:**

- Replacing backend list, group, or item endpoint contracts unless an existing operation is missing.
- Autosaving every keystroke to the backend for text fields.
- Removing explicit confirmation from destructive actions such as delete flows.
- Changing category management flows, which already use automatic persistence for ordinary category edits.
- Reworking fullscreen notes editing into blur/Enter autosave.
- Changing admin, account settings, authentication, member invitation, passkey, destructive confirmation, or component showcase explicit-save examples unless directly required by shared component changes.

## Decisions

1. Ordinary text editing commits on blur and Enter.

   This matches the existing automatic `EditableLabel` contract and category-name behavior, gives keyboard users a clear commit path, and avoids backend writes for each keystroke. Escape should abandon the active unsaved text edit back to the last committed value when the field has not yet committed; it should not reintroduce visible cancel buttons. Fullscreen notes are excluded from this rule and keep their current editor-local Save/Cancel interaction.

   Alternative considered: debounce every typed change. That feels more automatic, but it creates noisier API traffic, makes validation timing harder to understand, and complicates conflict/error recovery for small text fields.

2. Selection and toggle controls commit from their natural change events.

   Category, due date, recurrence, assignee, done, and starred changes already represent deliberate selections or activations. Persisting them immediately keeps the UI consistent with existing toggles and avoids a hidden "pending form" state for existing items.

   Alternative considered: aggregate all field changes until focus leaves the whole item form. That would reduce requests, but it keeps the old form-submit mental model without visible buttons and makes it harder to tell which value failed.

3. New-item creation remains a distinct commit once the required title is valid.

   The add-item form should collect draft values locally until the implementation-defined creation event, expected to be title blur or Enter once the title is non-empty. If focus leaves before creation or the quick-add form is minimized, the existing draft must remain available when the user reopens quick add. After successful creation, the draft resets. If creation fails, the draft stays in place with an error.

   Alternative considered: create an empty placeholder item as soon as the add-item action opens. That would mirror lists and groups, but it risks cluttering household lists with unnamed items and changes backend/list semantics more than the issue requires.

4. Placeholder list and group creation happens before name editing.

   Activating `new list` should call create-list with `unnamed list` and the default emoji, then navigate to the created list and focus/select the title. Activating create-group should call create-group with `unnamed group`, then focus/select that group's inline name editor in the overview.

   Alternative considered: keep local creation forms and autosave them on blur. That would remove buttons, but it would not satisfy the requested immediate-create behavior or direct navigation to the new list.

5. Autosave state is tracked per editor or field.

   Each autosaving surface should know its last committed value, pending draft value, saving/error state, and whether the latest commit is stale. Shared helpers are appropriate if they reduce duplication, but they should fit the existing Svelte store/component style.

   Alternative considered: centralize all autosave writes in a global queue. The app already has offline mutation helpers for some item operations, but this change does not require a new global persistence architecture.

## Risks / Trade-offs

- Duplicate saves from blur plus Enter -> Guard commits with unchanged-value checks and an in-flight flag or latest-request token.
- User navigates away during an in-flight autosave -> Keep optimistic local state only where existing stores can reconcile from API/SSE, and surface failures while the editor is still mounted.
- Validation becomes less obvious without buttons -> Show field-level errors near the editor and keep focusable invalid fields available for correction.
- Placeholder lists or groups may be left unchanged -> Accept as requested behavior; placeholders are real persisted records and can be renamed later through autosave.
- Fullscreen notes has visible chrome while other item form buttons disappear -> Treat the notes editor's existing save/back chrome as a field-specific editor commit/dismiss surface, not the ordinary item form save/cancel buttons targeted by this change.

## Migration Plan

1. Update frontend components and stores behind the existing routes.
2. Add focused unit/component tests for autosave commit events, unchanged-value guards, validation failures, placeholder creation focus/selection behavior, and category-management regressions where item category selection touches existing category controls.
3. Add or update Playwright coverage for creating a list, creating a group, adding an item, and editing an existing item without save/cancel controls.
4. Roll back by restoring the previous explicit button flows in the frontend; backend data does not need migration.
