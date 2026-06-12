## Why

Several interactive controls have domain-specific dynamic visuals that do not belong in the general Button API, including calendar dates, category color swatches, item completion and star toggles, and swipe-delete surfaces. Leaving these as visual-class exceptions would weaken the semantic styling guard and keep repeated accessibility and state behavior decentralized.

## What Changes

- Add dedicated shared controls for calendar day selection, color swatch selection, item completion toggling, item star toggling, and swipe-delete activation.
- Make each specialized control expose typed domain state rather than consumer-owned visual CSS.
- Reuse the semantic Button primitive internally where its native behavior and styling foundation fit the specialized interaction.
- Migrate DatePicker, CategoryConfigDialog, ItemCard, and related consumers to the dedicated controls.
- Add focused accessibility, keyboard, pointer/touch, state, and visual-contract tests for each control.
- Remove every temporary specialized-control exception introduced by `standardize-semantic-component-styling`.

## Capabilities

### New Capabilities

- `specialized-interaction-controls`: Dedicated shared controls own domain-specific interaction states and visuals without expanding the general Button API.

### Modified Capabilities

None.

## Impact

- Depends on the semantic Button API and styling guard from `standardize-semantic-component-styling`.
- Affects `DatePicker.svelte`, `CategoryConfigDialog.svelte`, `ItemCard.svelte`, and new shared controls and tests under `frontend/src/lib/components/`.
- Updates shared-component documentation, the development showcase where useful, and the semantic styling exception inventory.
- Does not change backend APIs, persistence, business rules, dependencies, or user workflows.
