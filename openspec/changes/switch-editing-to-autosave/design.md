## Context

See proposal.md for motivation. The frontend currently has a mixed model where list creation, group creation, and item forms still expose explicit action buttons. `ItemForm` owns new-item draft preservation and existing-item submission, and the list overview owns list/group creation plus navigation after list creation.

The existing backend endpoints already support create/update operations for lists, groups, and items. Backend authorization must remain the source of truth; this change should primarily reshape frontend commit timing and recovery behavior.

### Item editor scrolling investigation

The autosave implementation is present. Follow-up code inspection found that `ItemForm.svelte` already computes a 96px visual-viewport offset, but scrolls metadata rows synchronously on captured `pointerdown` and `focusin`. It does not cover the title, observe keyboard viewport changes, or reserve sufficient document scroll space. Moving a row while a pointer is down can also interfere with activation.

`ComboboxPrimitive.svelte` calls `scrollIntoView({ block: 'nearest' })` on highlighted options, which can scroll ancestor containers including the document. `DatePicker.svelte` programmatically focuses calendar days and its trigger using native scrolling. Both can compete with form alignment. The fullscreen notes dialog uses `min-h-screen` and a `70vh` textarea minimum, which does not account for the visible area above the keyboard.

`ItemForm` also releases whichever element is active when an asynchronous save finishes. A save from an earlier field can therefore blur a newer editing session. The existing scroll unit test mocks geometry and an unrestricted `scrollTop` setter; it verifies arithmetic, not browser scroll limits or mobile keyboard behavior. These are code findings; the proposed behavior has not yet been verified on mobile devices.

## Goals / Non-Goals

**Goals:**

- Use predictable autosave commit events: ordinary text fields commit on blur and Enter, selection controls commit when a valid selection changes, and toggle controls commit immediately.
- Create placeholder lists and groups immediately, then focus/select their placeholder names so the first typed text replaces them.
- Cover routine list organization editors that still use explicit controls: list titles from overview/detail/grocery views and list group names.
- Keep the quick-add item form's existing draft preservation when focus leaves or the form is minimized before creation.
- Prevent title blur from creating a quick-add item; quick-add creation requires an intentional creation event such as Enter or another explicit non-button gesture chosen during implementation.
- Keep the existing fullscreen notes editor workflow, including its Save and Cancel controls, because it is a field-specific long-form editor rather than the ordinary item form save/cancel flow.
- Keep failed saves recoverable by preserving the user's current draft and surfacing the error near the affected editor.
- Keep API writes idempotent from the user's perspective by avoiding duplicate commits for unchanged values.
- Preserve existing role-based visibility and backend authorization checks.
- Position activated existing-item title and metadata fields 96 CSS pixels below the visible viewport top, handle keyboard transitions, and preserve intentional manual scrolling.
- Keep the active editing session focused across unrelated asynchronous save completions and keep notes editing usable above the keyboard.

**Non-Goals:**

- Replacing backend list, group, or item endpoint contracts unless an existing operation is missing.
- Autosaving every keystroke to the backend for text fields.
- Removing explicit confirmation from destructive actions such as delete flows.
- Reworking fullscreen notes editing into blur/Enter autosave.
- Changing admin, account settings, authentication, member invitation, passkey, destructive confirmation, or component showcase explicit-save examples unless directly required by shared component changes.
- Applying the item editor's document alignment policy to quick add, list/group renaming, read-only item details, or standalone toggle/delete actions.

## Decisions

1. Ordinary text editing commits on blur and Enter.

   This matches the existing automatic `EditableLabel` contract and category-name behavior, gives keyboard users a clear commit path, and avoids backend writes for each keystroke. Escape should abandon the active unsaved text edit back to the last committed value when the field has not yet committed; it should not reintroduce visible cancel buttons. Fullscreen notes are excluded from this rule and keep their current editor-local Save/Cancel interaction.

   Alternative considered: debounce every typed change. That feels more automatic, but it creates noisier API traffic, makes validation timing harder to understand, and complicates conflict/error recovery for small text fields.

2. Selection and toggle controls commit from their natural change events.

   Category, due date, recurrence, assignee, done, and starred changes already represent deliberate selections or activations. Persisting them immediately keeps the UI consistent with existing toggles and avoids a hidden "pending form" state for existing items.

   Alternative considered: aggregate all field changes until focus leaves the whole item form. That would reduce requests, but it keeps the old form-submit mental model without visible buttons and makes it harder to tell which value failed.

3. New-item creation remains a distinct commit once the required title is valid.

   The add-item form should collect draft values locally until an intentional creation event, expected to be Enter in the title field or another explicit non-button gesture chosen during implementation. Title blur MUST NOT create the item. If focus leaves before creation or the quick-add form is minimized, the existing draft must remain available when the user reopens quick add. After successful creation, the draft resets. If creation fails, the draft stays in place with an error.

   Alternative considered: create an empty placeholder item as soon as the add-item action opens. That would mirror lists and groups, but it risks cluttering household lists with unnamed items and changes backend/list semantics more than the issue requires.

4. Placeholder list and group creation happens before name editing.

   Activating `new list` should call create-list with `unnamed list` and the default emoji, then navigate to the created list and focus/select the title. Activating create-group should call create-group with `unnamed group`, then focus/select that group's inline name editor in the overview.

   For newly created groups on mobile, the group name input should rely on the browser's native focused-input scrolling so the on-screen keyboard keeps the selected placeholder visible. Avoid custom repeated scroll timers here; allowing the focus operation to scroll has been verified to behave well.

   Alternative considered: keep local creation forms and autosave them on blur. That would remove buttons, but it would not satisfy the requested immediate-create behavior or direct navigation to the new list.

5. Autosave state is tracked per editor or field.

   Each autosaving surface should know its last committed value, pending draft value, saving/error state, and whether the latest commit is stale. Shared helpers are appropriate if they reduce duplication, but they should fit the existing Svelte store/component style.

   Alternative considered: centralize all autosave writes in a global queue. The app already has offline mutation helpers for some item operations, but this change does not require a new global persistence architecture.

6. One coordinator owns existing-item field alignment.

   Replace the independent row scroll actions with one coordinator owned by `ItemForm`, backed by a small DOM helper for measurement, event scheduling, and cleanup. Explicit anchors identify the outer title, category, due-date, recurrence, and assignee rows. The title participates even though the current helper omits it. Notes use the separate dialog policy below.

   Pointer down records the intended field without synchronously moving the document. After a completed activation and rendering, request alignment. Keyboard focus entering another field also requests alignment. Coalesce pointer/focus events from the same activation, defer pointer-origin focus alignment until activation completes, discard canceled gestures, and allow a later tap on the already focused control to request alignment again. Option and calendar interactions retain their field identity instead of restarting document alignment for each child control. Programmatic focus restoration is not a fresh user activation.

   The target is `anchor.getBoundingClientRect().top - visualViewport.offsetTop = 96` in CSS pixels, with approximately 2px tolerance for rounding. The offset is measured from the visible viewport top, not added to the app header height. Read geometry after rendering, ensure scroll range, and apply an immediate vertical correction. Fall back to zero viewport offset and window geometry if `VisualViewport` is unavailable.

   Observe visual-viewport resize and scroll events during keyboard transitions, with window resize as a fallback. Coalesce measurements and writes into one animation frame; ignore corrections within tolerance and prevent self-generated scroll events from creating a feedback loop. Track the active field/session so queued work cannot reposition a previous field. Use measured geometry and event-driven settling rather than guessed sequences of keyboard delay timers. Do not continuously pin a settled field on ordinary document scroll events.

   Wheel input, a touch drag, or intentional page-scrolling keys suspend pending alignment for the current activation. Do not treat caret movement or dropdown navigation keys as page-scroll intent. Pinch zoom also suspends corrections. A fresh field activation resumes alignment. Remove listeners and cancel pending work on editor teardown; suspend background coordination while notes are open.

   Alternative considered: `scroll-margin-top: 96px` plus a one-shot `scrollIntoView()`. This does not supply missing scroll range, coordinate keyboard viewport changes, or prevent competing ancestor scroll operations. Repeated fixed-delay scrolling would also compete with later user interactions.

7. The item detail page supplies enough trailing scroll space.

   Expose a noninteractive spacer after the item detail content, including its delete action. Grow it only by the missing scroll range needed to reach the requested target, measuring existing space without counting the reservation twice. The document remains the scroll owner; do not add a nested scrolling form.

   Retain reserved space through field changes, blur, and keyboard dismissal to avoid document clamping that pulls the active or just-edited row downward. Release it on leaving the item editor. Exact alignment remains subject to the document's top boundary; do not introduce negative scrolling. The deliberate extra space at the end of the edit page is the trade-off for making low fields reachable at 96px.

8. Nested editors scroll their own content and respect the visible viewport.

   In `ComboboxPrimitive`, reveal highlighted options by adjusting the listbox's own scroll position rather than calling ancestor-scrolling `scrollIntoView()`. Bound an open listbox's height to the space between its top and the visual viewport bottom, with a small bottom gutter, and update that measurement during viewport changes. Preserve pointer selection, filtering, hover, and keyboard navigation. Keep this behavior suitable for all shared-component consumers without imposing the item page's 96px document policy on them.

   Calendar programmatic focus should avoid unnecessary document scrolling. Constrain the calendar panel to available visible height and reveal focused days within that panel when internal scrolling is needed. Trigger focus restoration must not restart page alignment. Verify long menus and short landscape viewports, where aligning the trigger alone cannot make the full popup fit.

9. Autosave focus release belongs to the originating editing session.

   Capture the originating control and editing-session identity when requesting a save that releases focus. On completion, blur only if that same session still owns focus. Element identity alone is insufficient if the user leaves and returns to the same control during the request. Preserve existing commit and error-recovery behavior; scrolling itself must never blur a control or submit a value. This prevents a slow earlier save from dismissing the next field's keyboard.

10. Fullscreen notes use a separate viewport-aware layout.

    Opening notes suspends document alignment. Position and size the dialog against the visual viewport, with a window-geometry fallback, keep its existing Save/Cancel header visible, and allocate the remaining height to an internally scrolling textarea. Remove the screen/viewport-height minimums that force the textarea below the keyboard. The textarea caret remains reachable while editing long notes.

    Saving or canceling retains the existing notes commit semantics and returns focus to the trigger without restarting background field alignment. Prevent background scrolling while the dialog is active and restore the prior document position and temporary styles on close or teardown. This layout change does not turn notes into blur/Enter autosave.

## Risks / Trade-offs

- Duplicate saves from blur plus Enter -> Guard commits with unchanged-value checks and an in-flight flag or latest-request token.
- User navigates away during an in-flight autosave -> Keep optimistic local state only where existing stores can reconcile from API/SSE, and surface failures while the editor is still mounted.
- Validation becomes less obvious without buttons -> Show field-level errors near the editor and keep focusable invalid fields available for correction.
- Placeholder lists or groups may be left unchanged -> Accept as requested behavior; placeholders are real persisted records and can be renamed later through autosave.
- Fullscreen notes has visible chrome while other item form buttons disappear -> Treat the notes editor's existing save/back chrome as a field-specific editor commit/dismiss surface, not the ordinary item form save/cancel buttons targeted by this change.
- Keyboard transitions, browser chrome, and pinch zoom produce different viewport event sequences -> Use active-session guards and geometry-based corrections, suspend on manual intent, and verify on real iOS Safari/PWA and Android Chrome. Desktop viewport emulation is not proof of native keyboard behavior.
- Popups can exceed the space remaining below a 96px-aligned field -> Constrain popup height and scroll internally; do not promise that an arbitrarily tall popup or textarea is fully visible at once.
- Removing temporary scroll space or dialog scroll locks can shift the document -> Retain the edit-page reservation until exit and verify notes close/teardown restoration.

## Migration Plan

1. Update frontend components and stores behind the existing routes.
2. Add focused unit/component tests for autosave commit events, unchanged-value guards, validation failures, placeholder creation focus/selection behavior, and quick-add draft preservation when focus leaves.
3. Add or update Playwright coverage for creating a list, creating a group, adding an item, and editing an existing item without save/cancel controls.
4. Roll back by restoring the previous explicit button flows in the frontend; backend data does not need migration.

## Follow-up Validation: Item Editor Scrolling

- Unit/component tests: active field/session replacement, pointer/focus deduplication, canceled gestures, delayed viewport events, missing `VisualViewport`, tolerance and loop guards, manual scroll/zoom suspension, teardown, and slow-save focus ownership including leaving and returning to the same control.
- Browser tests: assert final rendered anchor position relative to the visual viewport (96px within tolerance), including the lowest field on a short page and keyboard-already-open field switching. Exercise actual scroll limits and verify menu navigation changes only internal scroll position.
- Regression tests: pointer activation, keyboard Tab navigation, calendar focus, long menus, multiline notes, Save/Cancel and focus restoration, quick-add draft preservation, and other consumers of shared controls. Run frontend type checks and relevant unit tests after implementation.
- Real devices: verify keyboard opening/dismissal, viewport panning, rapid field switching during a slow save, manual scrolling, portrait/landscape, and fullscreen notes on iOS Safari, installed iOS PWA, and Android Chrome. Record device/browser versions and outcomes; leave device verification pending if unavailable.
- For Playwright, use the repository's agent HTTPS workflow and reachable shared deployment. Do not start a local stack when that deployment is unavailable. Validate the updated OpenSpec change with `openspec validate switch-editing-to-autosave --strict`.

Documentation references consulted during exploration: [VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) and [scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView), retrieved through Context7 and checked against MDN.
