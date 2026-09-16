## Context

See `proposal.md` for motivation. The frontend already exposes `frontend/src/lib/components/Dialog.svelte`, which provides overlay dismissal, Escape handling, focus containment, a close button, body and footer snippets, and focus return. Some current production dialogs still duplicate modal shell markup, and list/item delete flows use browser `confirm(...)` prompts.

The main affected areas are:

- List route delete list flow in `frontend/src/routes/(app)/lists/[id]/+page.svelte`.
- Item detail delete flow in `frontend/src/routes/(app)/lists/[id]/items/[iid]/+page.svelte`.
- A new reusable `ConfirmDialog` component, plus its `/components` showcase example and tests.
- Hand-built modal shells in `DeleteCheckedItemsDialog.svelte`, `CategoryConfigDialog.svelte`, and `MembersDialog.svelte` where the shared Dialog shell can preserve existing behavior.
- The item notes editor is explicitly out of scope because it is a full-screen editing surface, not a classic modal dialog.
- Popover-style controls such as `DatePicker.svelte` are dialog-role popovers rather than app modal shells and should remain out of this migration unless implementation discovers they duplicate the shared modal contract.

## Goals / Non-Goals

**Goals:**

- Remove browser-native delete confirmations from list and item deletion flows.
- Introduce `ConfirmDialog` as the shared destructive confirmation component, built on Dialog and Button.
- Use shared Dialog composition for audited modal shells while preserving current copy, permissions, focus behavior, loading states, cancellation, navigation, and error handling.
- Keep destructive confirmations testable by accessible dialog names and button labels.
- Add `ConfirmDialog` to the component showcase with interactive states.
- Reduce repeated overlay, ARIA, header, close, and footer markup in consumer components.

**Non-Goals:**

- Replacing all browser `alert(...)` error reporting across the app.
- Redesigning Dialog visuals or introducing a new modal library.
- Changing backend delete APIs, authorization, or list/item persistence behavior.
- Converting non-modal popovers that use `role="dialog"` for local picker semantics.
- Migrating the item notes editor to Dialog.

## Decisions

1. Build destructive confirmations through a reusable `ConfirmDialog` component that composes Dialog.

   List deletion, item deletion, category deletion, and checked-item deletion all share the same interaction shape: title, explanatory body, optional error text, Cancel, destructive confirm button, and pending state. A focused wrapper keeps those flows consistent while still relying on Dialog for the shared shell behavior.

   Alternative considered: compose Dialog directly in every confirmation flow. That avoids a new component API but leaves several destructive flows free to drift in labels, footer layout, loading behavior, and error placement.

2. Add `ConfirmDialog` to the component showcase.

   This follows the existing shared-component adoption rule for new reusable frontend components. The showcase should render the real component and demonstrate cancellation, confirmation, and pending behavior so future changes have a visible contract.

   Alternative considered: skip showcase coverage because ConfirmDialog is small. That would make the component less discoverable and weaken the app's shared-component convention.

3. Treat the item notes editor as out of scope.

   The item notes editor is a full-screen editing surface with its own Cancel/Save header and text-entry ergonomics. It is not a classic modal confirmation or management dialog, so migrating it would broaden the change without serving issue #266.

   Alternative considered: force every `role="dialog"` block through Dialog. That would risk changing picker and editor ergonomics unrelated to issue #266.

4. Pause before migrating `MembersDialog`.

   `MembersDialog` has a hand-built modal shell and select/listbox positioning tests that are sensitive to dialog geometry. Implementation should first migrate ConfirmDialog-driven flows and category/delete-checked shells, verify those tests, then migrate MembersDialog in a separate step with its own targeted test run. This makes any failures easier to attribute.

   Alternative considered: migrate every manual shell in one pass. That is faster on paper but mixes confirmation behavior, category management, and member select positioning into one failure surface.

## Risks / Trade-offs

- Focus return differs from browser prompts -> Pass `returnFocusTo` from the triggering control where practical and cover with interaction tests.
- Nested category delete confirmation may conflict with the category management dialog -> Keep the delete confirmation as its own Dialog instance above the parent and ensure cancellation/failed deletion leaves the parent state intact.
- Shared Dialog backdrop/Escape close may allow dismissing pending destructive operations -> Disable or guard cancellation handlers while the delete request is pending, matching existing delete-checked behavior.
- ConfirmDialog API could become too broad -> Keep it focused on destructive confirmation semantics and use snippets only for body content that varies by flow.
- MembersDialog migration could break select positioning tests -> Pause before that migration and run targeted MembersDialog tests independently.
- Migrating too many `role="dialog"` popovers can change non-modal controls -> Audit each dialog-role block and migrate only modal shells that match the spec requirement.

## Migration Plan

1. Add or adjust tests around list delete, item delete, category delete, and delete-checked flows to assert in-app dialogs by role/name and cancellation behavior.
2. Add ConfirmDialog and showcase coverage.
3. Replace `confirm(...)` list and item prompts with ConfirmDialog state and handlers.
4. Migrate delete-checked and category confirmation/modal shells that match Dialog's contract.
5. Pause and run targeted tests before migrating MembersDialog.
6. Migrate MembersDialog separately if the checkpoint is clean.
7. Run frontend type-check and targeted Vitest suites for affected route/component tests.
8. Rollback is a frontend-only revert of the migrated Svelte components and tests; no data migration is involved.
