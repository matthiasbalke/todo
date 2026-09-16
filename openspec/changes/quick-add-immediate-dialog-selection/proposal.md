## Why

Quick-add detail dialogs currently require an extra save action after the user has already selected a category, date, recurrence, or assignee value. Removing that redundant confirmation makes quick-add faster while keeping cancellation safe and predictable.

## What Changes

- Single-selection quick-add detail dialogs apply the selected value immediately and close after a value is selected.
- Multi-select quick-add details, including assignees, apply each complete selection set as the user adds or removes selected values.
- Selection-oriented quick-add detail dialogs do not offer Save or Cancel actions.
- Dialogs keep the title-bar close affordance, and clicking or touching outside a dialog dismisses it without applying any untouched selection.
- Notes keep an explicit Save action because typed text entry is not a discrete selection interaction, but use the title-bar close affordance instead of a Cancel button.
- Quick-add detail dialogs are built on a shared dialog shell so close, outside-dismiss, labeling, focus return, and surface styling are not reimplemented inline.
- The new shared dialog shell is added to the components showcase for visual and interaction review.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `item-form-overhaul`: Change quick-add detail dialog behavior so picker selections update the pending quick-add draft immediately, single-value selections close the dialog, and dialog footers no longer include Cancel actions.

## Impact

- Frontend quick-add composer and a reusable dialog shell component.
- Frontend components showcase.
- Quick-add assignee multi-select integration.
- Frontend component/unit tests and Playwright coverage for quick-add detail dialogs.
- No backend API or persistence contract changes.
