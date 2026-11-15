# Proposal

## Why

Quick-add currently opens a modal for every optional detail, interrupting entry in the bottom composer. [Issue #332](https://github.com/matthiasbalke/todo/issues/332) requests value selection directly in that bottom area.

## What Changes

- Replace quick-add detail dialogs with a focused detail view that temporarily replaces the compact composer in the same fixed footer.
- Focus the category or assignee selector input immediately on entry; retain multi-assignee selection.
- Offer Today, Tomorrow, Next week, and Custom due-date choices, with Next week meaning next Monday and Custom opening the shared date picker.
- Expose Daily, Weekly, Monthly, and Custom recurrence choices while retaining the additional supported recurrence modes and custom configuration from #311.
- Show the existing notes textarea in the bottom view with the same Cancel/back and Save workflow as item details; outside interaction keeps the editor open and preserves unsaved text.
- Preserve draft values, intentional submission, chip clearing, and incomplete recurrence input through view transitions and minimization.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `item-form-overhaul`: Replace quick-add modal detail editing with inline footer views and update submission terminology and scenarios.

## Impact

Frontend quick-add layout, focus management, shared selector focus hooks if needed, date-only helpers, component tests, and list-page Playwright coverage. Existing-item editing, backend APIs, database schema, and item payloads remain outside this change. No new runtime dependency is expected.
