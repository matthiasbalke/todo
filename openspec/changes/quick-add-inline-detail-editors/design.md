# Design

## Context

See proposal.md for motivation and specs/item-form-overhaul/spec.md for behavior. QuickAddItemForm currently owns the draft, an active-detail discriminator, a Dialog wrapper, staged notes, and recurrence editor state. The list page preserves emitted drafts when the footer minimizes. RecurrenceEditor already separates incomplete input from the last applied rule and stages weekday edits until close.

## Goals / Non-Goals

**Goals:** Keep one draft owner and one active footer view; make transitions predictable for keyboard and touch users; reuse existing selectors, calendar, textarea, and recurrence validation.

**Non-Goals:** Redesign existing-item editing, change shared popup semantics globally, alter API contracts, or introduce a second recurrence implementation.

## Decisions

### Render detail views inside the existing footer

Use the existing active-detail state to conditionally render either the compact chip/title composer or a named detail section with Back. Remove the quick-add Dialog wrapper and its modal-only focus handling. Keep state in QuickAddItemForm across conditional rendering. Reusing Dialog with cosmetic styling was considered, but its backdrop and focus trap conflict with this interaction. A separate editor route would add navigation and draft synchronization without benefit.

Bound footer detail content to available viewport height with internal scrolling so the notes textarea and custom recurrence controls remain reachable with a mobile keyboard. Keep the footer's existing relationship to the page content.

### Centralize transitions and focus restoration

Opening a category or assignee view focuses the actual searchable input after rendering; inspect existing component APIs and add a narrow opt-in focus hook only if needed. Other views focus their first meaningful control; notes focus the textarea. Complete category, date, and basic recurrence selections return to title entry. Back and Escape restore the corresponding trigger; multi-assignee editing stays open until explicitly left.

Handle nested popup Escape before detail-view Escape. Extend existing internal-focus detection to include any portaled selector/calendar content so selecting a value cannot minimize the draft. Outside interaction retains the existing minimize behavior for selection views and does not force focus back into the footer. The notes view is an exception: outside interaction leaves it open with its unsaved buffer intact.

### Reuse date-only and timezone conventions

Calculate Today from the account's configured timezone using the established date helpers. Tomorrow adds one calendar day. Next week selects the next Monday strictly after today (seven days ahead when today is Monday). Use calendar arithmetic without adding elapsed milliseconds across daylight-saving changes. Keep nullable YYYY-MM-DD submission. Custom opens the shared DatePicker directly; do not add a new calendar. Merely showing a picker trigger after selecting Custom would add an unnecessary activation.

### Preserve recurrence and note commit boundaries

Reuse RecurrenceEditor, including No recurrence, Yearly, Weekdays, and all custom configuration. The issue's shorter preset list does not remove existing supported values. Route Back, Escape, and outside minimization through the same complete-rule commit behavior used on editor close. Preserve raw invalid input in the emitted draft and keep creation blocked until corrected or cleared.

Keep a local notes buffer initialized from applied notes. Match the item-details editor header with Cancel/back, a centered Notes title, and Save. Save commits to the pending item draft and returns without creating the item. Cancel/back or Escape discards the buffer and returns. Outside interaction leaves the notes view open and preserves its unsaved buffer; it must not trigger composer minimization. This preserves the item-details notes workflow while moving its textarea into the footer. Live note updates were considered but would change dismissal semantics beyond the requested relocation.

## Risks / Trade-offs

- [Focus transitions accidentally minimize the draft] → Guard internal transitions and verify keyboard, pointer, and portaled-popup paths at the component and browser levels.
- [A tall footer obscures content on mobile] → Constrain height, allow internal scrolling, and check a narrow viewport with keyboard focus.
- [Recurrence weekday edits apply partially or disappear on minimization] → Keep one close/commit path and assert the final rule and raw draft independently.
- [Relative dates drift at timezone or daylight-saving boundaries] → Exercise calendar-day calculations with fixed clocks and configured timezones.

## Migration Plan

Ship as a frontend change with no data migration or new dependency. Existing in-memory drafts retain the same shape. Rollback restores the previous frontend. After implementation and user review, sync the delta and archive this change using the repository workflow.
