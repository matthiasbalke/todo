## Why

Member invite suggestions are currently exposed through a native datalist-backed email input. GitHub issue #242 reports that suggestions appear in desktop browsers, including desktop browsers at mobile-sized viewports, but no suggestion selector appears on real mobile browsers while typing in the members dialog.

## What Changes

- Replace the mobile-browser-unreliable native datalist suggestion interaction with an explicit suggestion picker that appears while typing and works with touch activation.
- Extract shared custom combobox/listbox layout and interaction behavior from the existing `Select` pattern that already works for category selection on mobile devices.
- Keep closed-option select behavior and free-text suggestion behavior split in their wrapper components.
- Keep arbitrary typed email entry so owners can invite accounts that are not suggested.
- Preserve existing suggestion filtering, owner-only loading, email validation, and invite submission behavior.
- Add regression coverage for typing-triggered suggestion visibility and touch/mobile-style suggestion selection in the shared invite control and membership dialog flow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `list-member-management`: Member invite suggestions must appear while typing and be selectable through a mobile-operable control while arbitrary typed invite emails remain supported.

## Impact

- Frontend shared component code needs a combobox/listbox primitive for popup layout, focus, keyboard, filtering, and mobile-safe option activation, reused by both closed-option `Select` behavior and the free-text member invite email control.
- `MembersDialog` should continue passing loaded suggestions and submitting the selected or typed email unchanged.
- Frontend component tests should cover suggestion visibility while typing, touch/click selection, typed unsuggested emails, and dialog submission after selecting a suggestion.
