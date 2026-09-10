## Why

List group headers currently place the group action menu after the collapse chevron, which differs from the app's surrounding control ordering and makes the group header actions feel slightly inconsistent. Moving the menu before the chevron and left-aligning the primary `new list` action gives the `/lists` overview a cleaner, more predictable layout while preserving the existing controls.

## What Changes

- Move each list group action menu control to the left of its collapse/expand chevron in `/lists` group headers.
- Align the `new list` footer action content to the left while keeping it as the primary flexible action beside the group creation icon.
- Preserve existing menu behavior, collapse behavior, drag handles, accessible names, keyboard operation, and responsive layout.
- Keep the visual treatment consistent for persisted list groups and the virtual Ungrouped section.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `list-ui-capabilities`: Add list overview control-order and primary creation-action alignment requirements.

## Impact

- Affected frontend components/tests around the `/lists` overview list group header and fixed footer creation actions.
- No backend API, persistence, dependency, or data model changes.
