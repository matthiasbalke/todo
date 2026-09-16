## Why

Browser-native confirmation prompts for deleting lists and items are visually inconsistent with the rest of the app and cannot share the app's accessibility, loading, and error-handling patterns. The app already has a shared Dialog primitive, so destructive confirmations and existing hand-built dialog shells should converge on that component.

## What Changes

- Replace browser `confirm(...)` prompts used for list and item deletion with custom confirmation dialogs built on the shared Dialog component.
- Introduce a reusable `ConfirmDialog` component for destructive confirmations and add it to the development components showcase.
- Preserve existing delete behavior, navigation, permissions, loading prevention, cancellation, and error reporting while moving the confirmation UI into app-rendered dialogs.
- Migrate manually defined modal dialog shells, including delete-checked and category confirmation dialogs, to compose the shared Dialog component instead of duplicating overlay, ARIA, close, and focus behavior.
- Keep the item notes editor out of the migration because it is a full-screen editor rather than a classic modal dialog.
- Keep non-confirmation browser `alert(...)` usages out of scope unless they are part of a migrated delete confirmation flow.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `shared-component-adoption`: production confirmation and modal dialogs must use the shared Dialog component where a dialog shell is needed.

## Impact

- Frontend Svelte routes and shared components that currently use `confirm(...)` or hand-built modal shells.
- Frontend component and route tests covering list deletion, item deletion, delete-checked cleanup, category deletion, keyboard dismissal, cancellation, and failed delete handling.
- No backend API, persistence, authentication, or deployment changes are expected.
