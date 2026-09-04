## Why

The add-item form currently discards entered data when focus moves away from the form. This makes accidental taps, clicks, or focus changes costly because the form is minimized and the user's draft is lost.

## What Changes

- Preserve all entered new-item form input when focus leaves the add-item form and the form is minimized.
- Reopen the minimized add-item form with the preserved draft values still populated.
- Keep the existing successful-submit reset behavior so a created item clears the draft and restores default new-item state.
- Keep explicit cancel behavior as the way to discard an in-progress draft.

## Capabilities

### New Capabilities
- `add-item-draft-preservation`: Covers preserving new-item draft fields when the add-item form minimizes because focus leaves it, and clearing drafts only through successful submission or explicit cancellation.

### Modified Capabilities

## Impact

- Frontend list detail add-item form state and visibility handling.
- `ItemForm` unit tests for focusout/cancel behavior and draft reset behavior.
- List detail page tests or e2e coverage for minimizing and reopening the add-item form with draft values intact.
- No backend API, database, authentication, or dependency changes expected.
