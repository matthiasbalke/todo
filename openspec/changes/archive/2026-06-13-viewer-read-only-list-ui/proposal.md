## Why

Users with the `VIEWER` list role can currently see write controls throughout list and item screens even though the backend rejects those operations. The UI must reflect the existing authorization model before cross-list views reuse these components with items from lists having different permissions.

## What Changes

- Include the current user's list role in list summary and detail API responses.
- Derive frontend capabilities from the current user's role instead of having presentation components interpret roles independently.
- Make standard item cards read-only for viewers by removing completion, starring, deletion, and reorder interactions while retaining item navigation and status presentation.
- Make grocery mode read-only for viewers by removing completion interactions.
- Replace the editable item detail form with a read-only item detail presentation for viewers.
- Hide item creation, list editing, and category management controls when the current user lacks the required role.
- Keep member information visible to all list members while limiting membership changes to owners.
- Preserve viewer access to local display controls and personal list organization, including filters, sorting, hide-checked preferences, list groups, and navigation between standard and grocery modes.
- Keep backend authorization checks unchanged as the authoritative enforcement layer.

## Capabilities

### New Capabilities

- `list-ui-capabilities`: Expose and derive role-based UI capabilities for the current user's access to each list.
- `viewer-read-only-list-ui`: Render every list, item, category, and membership surface consistently without write affordances when the current user lacks the required capability.

### Modified Capabilities

None.

## Impact

- Backend list summary and detail DTOs and their frontend API types gain the current user's role.
- Frontend list store models retain the role and expose derived capabilities.
- Standard list, grocery list, item detail, item card, category, and member UI components consume explicit capabilities.
- Existing frontend component and page tests require role-aware fixtures and new viewer-mode coverage.
- Backend integration tests cover role data in list responses; existing authorization behavior remains unchanged.
