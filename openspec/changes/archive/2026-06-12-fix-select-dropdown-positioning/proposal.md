## Why

The shared Select positions its fixed listbox from viewport coordinates, but a transformed ancestor such as the vertically centered MembersDialog changes the fixed-position containing block. As a result, member-role options appear near the bottom-right of the screen instead of directly below their trigger.

## What Changes

- Make shared Select listboxes remain visually anchored directly below their trigger when rendered inside transformed dialogs and other positioned containers.
- Preserve existing Select sizing, keyboard navigation, focus behavior, selection callbacks, outside-click dismissal, and semantic styling ownership.
- Add regression coverage for generic Select positioning and both role selectors in MembersDialog.
- Keep positioning logic in the shared Select rather than adding dialog-specific offsets or visual overrides.

## Capabilities

### New Capabilities

- `select-dropdown-positioning`: Shared Select listboxes use a consistent trigger-relative positioning contract across normal pages, forms, and transformed dialogs.

### Modified Capabilities

None.

## Impact

- Affects `frontend/src/lib/components/Select.svelte`, `Select.test.ts`, and new or updated MembersDialog tests.
- May update shared-component documentation to describe the listbox positioning contract.
- Does not change Select values, public business APIs, backend behavior, dependencies, or member-role workflows.
