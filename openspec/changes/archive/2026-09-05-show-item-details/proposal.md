## Why

Item detail editing currently omits basic audit metadata, so users cannot see when an item was created or last changed, or which user performed those actions. GitHub issue 118 requests this information directly on the item detail page.

## What Changes

- Show item update metadata below the note field in the item detail page in both editable and read-only modes.
- Show item creation metadata below the update metadata in both editable and read-only modes.
- Format the metadata as two compact centered English-locale lines, for example `Fri. 8. May 26 at 14:07 updated by User` and `Fri. 8. May 26 at 14:07 created by User`.
- Introduce `updatedByUserId` so the updated row can display the user who last changed the item.
- Reuse existing item audit fields from the frontend model/API response where available; do not add editing controls for these read-only values.

## Capabilities

### New Capabilities

### Modified Capabilities
- `list-ui-capabilities`: Adds read-only created/updated audit metadata to editable and read-only item detail UI.

## Impact

- Backend item persistence/API/SSE: add and maintain `updatedByUserId`.
- Frontend item detail and edit components: render audit metadata beneath the note field.
- Frontend item data mapping/types: retain created/updated timestamps and user IDs for audit display.
- Tests: add focused component coverage for visible audit rows and graceful handling of missing user values if applicable.
