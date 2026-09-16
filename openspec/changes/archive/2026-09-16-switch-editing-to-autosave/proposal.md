## Why

Save/cancel editing flows add extra friction for routine household list maintenance, especially on small screens where users expect changes to stick as they type or leave a field. GitHub issue #264 requests that item, list, and group editing move to autosave behavior, and that newly created lists and groups open directly into a ready-to-replace placeholder name.

## What Changes

- Remove visible save/cancel controls from add-item, edit-item, list creation, list editing, group creation, and group editing flows where the user is editing ordinary field values.
- Persist edited values automatically at implementation-defined commit points, such as blur, Enter, control selection, debounce, or another event that preserves user intent and avoids partial invalid saves.
- Keep quick-add item draft preservation when the form is minimized or focus leaves before an item is created.
- Do not create a quick-add item when the title input blurs; leaving the quick-add form preserves the draft.
- Keep the existing fullscreen notes editor workflow, including its field-specific Save and Cancel controls.
- Make the add-list action immediately create a list named `unnamed list` with the default emoji, open it, focus the title editor, and select the placeholder text.
- Make the add-group action immediately create a group named `unnamed group`, focus its name editor, and select the placeholder text.
- Preserve validation and backend authorization behavior for item, list, and group writes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `list-ui-capabilities`: List and group creation/editing behavior changes from explicit confirmation to immediate creation plus autosaved inline edits.
- `item-form-overhaul`: New-item and existing-item form value edits autosave without visible form-level save/cancel controls, while fullscreen notes editing keeps its current workflow.
- `add-item-draft-preservation`: Quick-add draft preservation remains required while draft reset behavior aligns with autosave, because ordinary save/cancel buttons are no longer available in the normal new-item editing flow.

## Impact

- Frontend list overview, list detail, grocery list detail, and inline editing components.
- Frontend list detail item form, item detail editing, and add-item draft handling.
- Frontend stores and API clients that currently wait for explicit submit/save actions.
- Existing backend write endpoints and role checks remain authoritative; endpoint contracts should only change if implementation discovers a missing mutation primitive.
- Unit/component tests and Playwright coverage for list creation, group creation, item creation, item editing, and autosave failure handling.
