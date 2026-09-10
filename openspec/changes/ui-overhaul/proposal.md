## Why

The current list and item editing UI has inconsistent control sizing, cramped mobile spacing, and an item form that is harder to scan than the rest of the app. Issue #177 requests a focused UI overhaul to make navigation, list/group creation, and add/edit item workflows clearer and easier to use, especially on iPhones.

## What Changes

- Prepare the style foundation for future light/dark themes with overridable semantic color variables, paired foreground/surface roles, and app-level theme scope. Require a temporary, conspicuously different alternate palette for browser verification; production theme selection and a finished dark palette remain future work.
- Establish a shared style foundation for all shared frontend components, covering typography, semantic colors, spacing, corners, control geometry, and interaction states. Components consume theme values and named presets while retaining their native semantics and existing semantic props.
- Consolidate existing visual definitions first, preserving the current appearance and documenting intentional differences, then review the foundation on the components page before visual tuning.
- Increase the visual weight and tap target consistency of back-navigation and menu icon buttons.
- Standardize functional UI icons on Lucide SVG icons so controls no longer mix text glyphs, emoji icons, and hand-authored SVGs.
- Replace the list overview list creation action with a Lucide `Plus` icon followed by `new list`, and replace the group creation text action with a right-aligned Lucide `Group` icon action.
- Add more visual breathing room around fixed footer actions so button borders do not sit close to rounded display edges or bottom safe-area insets.
- Show the Lucide `Group` icon before every list group name, and align list group, category, and checked-items expand/collapse controls with the same right-aligned disclosure pattern.
- Rework `ItemForm` so the title row starts with the completion/status control, shows the title field, and places the starred control to the right of the title.
- Present non-title item form rows with meaningful leading icons and empty-state placeholder text that communicates the row label when no value is selected.
- Replace the bespoke assignee chip field in `ItemForm` with a reusable multi-select based on the existing select/combobox interaction patterns, including avatar-before-name rendering for assignees.
- Make item form controls visually borderless to align with `EditableLabel`-style inline editing.
- Improve note editing by showing a larger preview in the form, truncating long displayed notes with `...`, and opening a fullscreen note editor on focus/click.
- Add the multi-select to the components page and add sidebar navigation so the growing component showcase can jump to individual component sections.

## Capabilities

### New Capabilities
- `shared-style-foundation`: Defines centrally owned visual values and semantic presets, consistent adoption across shared components, and a showcase for reviewing the app's visual language.
- `item-form-overhaul`: Covers the add/edit item form row layout, inline status/star controls, icon-led rows, borderless presentation, placeholders, and fullscreen note editing behavior.
- `multiselect-component`: Covers reusable multi-value selection behavior built from existing select/combobox patterns, including custom option and selected-value rendering.
- `component-showcase-navigation`: Covers the components page sidebar navigation and the new multi-select showcase section.
- `icon-system`: Covers the selected Lucide SVG icon system and where functional icons, emoji content, and app assets may be used.

### Modified Capabilities
- `list-ui-capabilities`: Adds requirements for list overview creation action labels, mobile bottom spacing, and stronger navigation/menu icon button presentation.
- `textarea-component`: Extends shared textarea behavior to support ItemForm's fullscreen note editing workflow while preserving multiline value semantics.
- `specialized-interaction-controls`: Extends completion and star toggles so ItemForm can reuse the same domain controls outside ItemCard with appropriate sizing and accessible state.

## Impact

- Affected frontend areas include `frontend/src/lib/components/ItemForm.svelte`, shared form/control components, list overview footer actions, app/list navigation controls, and related component and route tests.
- Foundation adoption also covers `frontend/src/app.css`, the existing `controlStyles.ts` and icon presets, all shared frontend components, and the components showcase. Existing screens receive shared styling through component adoption; screen layout redesign is outside this extension.
- No backend API, database schema, authentication, SSE, or Docker changes are expected.
- The implementation should preserve existing item submission, draft preservation, focus-out cancellation, category/date/recurrence/assignee behavior, and audit metadata display.
