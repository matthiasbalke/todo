# list-ui-capabilities Specification

## Purpose

Define how list roles are exposed to the frontend and mapped to semantic UI capabilities while backend authorization remains authoritative.

## Requirements

### Requirement: List responses expose the current user's role
The list summary and list detail APIs SHALL include the authenticated user's membership role for each returned list.

#### Scenario: User loads accessible lists
- **WHEN** an authenticated user requests their list summaries
- **THEN** each summary includes that user's `OWNER`, `EDITOR`, or `VIEWER` role for the corresponding list

#### Scenario: User loads a list
- **WHEN** an authenticated list member requests a list detail
- **THEN** the response includes that user's role for the requested list

### Requirement: Frontend retains list role
The frontend list model and store SHALL retain the current user's role supplied by list API responses.

#### Scenario: Lists are loaded
- **WHEN** the frontend maps list summary responses into its list store
- **THEN** each stored list retains the role from its response

#### Scenario: List details are loaded or updated
- **WHEN** the frontend maps a list detail response into an existing list
- **THEN** the stored current-user role is preserved

### Requirement: Frontend derives capabilities centrally
The frontend SHALL derive list UI capabilities from the current user's role through one shared mapping rather than duplicating role comparisons across presentation components.

#### Scenario: Owner capabilities are derived
- **WHEN** the current user's list role is `OWNER`
- **THEN** the derived capabilities permit item mutation, category management, list management, list duplication, and membership management

#### Scenario: Editor capabilities are derived
- **WHEN** the current user's list role is `EDITOR`
- **THEN** the derived capabilities permit item mutation and category management
- **AND** they do not permit list management, list duplication, or membership management

#### Scenario: Viewer capabilities are derived
- **WHEN** the current user's list role is `VIEWER`
- **THEN** the derived capabilities do not permit item mutation, category management, list management, list duplication, or membership management

### Requirement: Editable users can drag items between category groups
The list view SHALL allow users with item mutation capability to move an unchecked item between category groups by drag and drop when manual item dragging is active.

#### Scenario: Item is moved into another category
- **WHEN** an editable user drags an unchecked item from one category group and drops it into a different category group
- **THEN** the item is assigned to the destination category
- **AND** the destination category's manual item order is persisted with the moved item at the dropped position

#### Scenario: Item is moved into uncategorized group
- **WHEN** an editable user drags an unchecked categorized item into the uncategorized group
- **THEN** the item category is cleared
- **AND** the uncategorized group's manual item order is persisted with the moved item at the dropped position

#### Scenario: Item is reordered inside current category
- **WHEN** an editable user drags an unchecked item within its current category group
- **THEN** the item remains assigned to its current category
- **AND** that category group's manual item order is persisted

#### Scenario: Viewer cannot drag items between categories
- **WHEN** a viewer opens a list grouped by category
- **THEN** item drag handles and category drop targets are not available for moving items

### Requirement: Editable users can sort categories in the configure dialog
The configure categories dialog SHALL allow users with category management capability to reorder real categories by drag and drop.

#### Scenario: Category order is changed in configure dialog
- **WHEN** an editable user drags a category by its reorder handle to a different position in the configure categories dialog
- **THEN** the dialog category rows are reordered to match the dropped position
- **AND** the category order is persisted for subsequent loads of the list

#### Scenario: Configure dialog uses drag handles instead of arrows
- **WHEN** an editable user opens the configure categories dialog
- **THEN** each category row exposes a drag handle for reordering
- **AND** up and down arrow controls for reordering categories are not displayed

#### Scenario: Dialog category editing remains available
- **WHEN** an editable user reorders categories in the configure categories dialog
- **THEN** category rename, color selection, delete, and add actions remain available
- **AND** the reordered categories keep their names, colors, and item assignments

#### Scenario: Uncategorized is not sortable in the dialog
- **WHEN** an editable user opens the configure categories dialog
- **THEN** only real categories are displayed as sortable rows
- **AND** no uncategorized category row is created or persisted

### Requirement: Users can sort list groups on the lists overview
The `/lists` overview SHALL allow a signed-in user to reorder their persisted list group wrappers by drag and drop.

#### Scenario: List group order is changed on lists overview
- **WHEN** a signed-in user drags a persisted list group wrapper to a different position on `/lists`
- **THEN** the displayed persisted list groups are reordered to match the dropped position
- **AND** the list group order is persisted for subsequent loads of `/lists`

#### Scenario: Lists remain inside their groups
- **WHEN** a signed-in user reorders list group wrappers on `/lists`
- **THEN** each list remains assigned to its original persisted group or the virtual Ungrouped section
- **AND** each group's list order remains unchanged

#### Scenario: Ungrouped section remains at bottom
- **WHEN** the virtual Ungrouped section is visible and a signed-in user reorders persisted list groups on `/lists`
- **THEN** only persisted list group wrappers are repositioned
- **AND** the virtual Ungrouped section remains displayed after all persisted list groups

#### Scenario: Existing list dragging remains available
- **WHEN** a signed-in user reorders or moves lists within or between list group sections
- **THEN** list-card drag handles and list drop behavior continue to work independently from list group wrapper dragging

#### Scenario: List category order is unchanged
- **WHEN** a signed-in user reorders list group wrappers on `/lists`
- **THEN** no category order within any individual list is changed
- **AND** no category reorder endpoint is invoked

#### Scenario: Uncategorized category group remains last
- **WHEN** a signed-in user reorders list group wrappers on `/lists`
- **THEN** the uncategorized category group inside any individual list remains governed by the uncategorized-last category group requirement
- **AND** list group sorting SHALL NOT create or persist a sortable position for the uncategorized category group

### Requirement: List group collapse state is restored locally
The `/lists` overview SHALL persist list group expanded/collapsed state locally on the user's device and restore it on later visits.

#### Scenario: Persisted list group is collapsed
- **WHEN** a signed-in user collapses a persisted list group on `/lists`
- **THEN** that group is hidden on the overview without changing its lists or sort order
- **AND** the collapsed state is saved locally for the same browser/device

#### Scenario: Persisted list group state is restored
- **WHEN** a signed-in user returns to `/lists` after previously collapsing a persisted list group on the same browser/device
- **THEN** that list group is rendered collapsed
- **AND** other list groups use their own saved collapsed state or the default expanded state

#### Scenario: Ungrouped section state is restored
- **WHEN** a signed-in user collapses the virtual Ungrouped section and later returns to `/lists` on the same browser/device
- **THEN** the Ungrouped section is rendered collapsed
- **AND** the section remains virtual and is not persisted as a backend list group

#### Scenario: Local storage is unavailable
- **WHEN** local preference storage cannot be read or written
- **THEN** the `/lists` overview remains usable
- **AND** list group sections default to expanded when no saved state can be restored

### Requirement: Uncategorized category group is displayed last
The list UI SHALL display the virtual uncategorized category group after all real category groups whenever the uncategorized group is visible.

#### Scenario: Uncategorized group appears after sorted categories
- **WHEN** a list contains visible items in real category groups and visible uncategorized items
- **THEN** the real category groups are displayed in category sort order
- **AND** the uncategorized group is displayed after the final real category group

#### Scenario: Uncategorized-only list
- **WHEN** a list contains visible uncategorized items and no visible real category groups
- **THEN** the uncategorized group is displayed as the only category group

#### Scenario: Category group sorting does not move uncategorized
- **WHEN** category group sorting is available and an editable user reorders real category groups
- **THEN** the uncategorized group remains displayed after all real category groups
- **AND** uncategorized item membership and item order remain unchanged

#### Scenario: Item is moved into uncategorized group
- **WHEN** an editable user moves an item into the uncategorized group
- **THEN** the item appears in the uncategorized group
- **AND** the uncategorized group remains displayed after all real category groups

### Requirement: List views expose active filter and sort state
The standard list view and grocery list view SHALL display a compact summary near the rendered items with item count and active sort order, and SHALL add filter-clearing controls to that summary when filters are active.

#### Scenario: Active filters are visible outside the menu
- **WHEN** a user opens a standard list view or grocery list view with one or more active filters
- **THEN** the view displays each active filter in a compact summary near the rendered list items
- **AND** the user can identify that the visible item set is filtered without opening the list options menu

#### Scenario: Individual filters can be reset from the summary
- **WHEN** a user activates the clear control for one active filter in the summary
- **THEN** only that filter is reset to its default inactive value
- **AND** other active filters, sort field, and sort direction remain unchanged

#### Scenario: Hide checked is a filter
- **WHEN** a user opens the filter submenu
- **THEN** Hide checked is presented with the other filter controls
- **AND** enabling Hide checked contributes to the active filter count and displays a filter chip in the summary

#### Scenario: Sort order can be changed from the summary
- **WHEN** a user opens a standard list view or grocery list view
- **THEN** the view displays the active sort field and direction near the rendered list items
- **AND** the user can open or invoke sort selection directly from that summary control without first opening the list options menu
- **AND** that selection allows changing both the sort field and ascending/descending direction

#### Scenario: No filter clutter when defaults are active
- **WHEN** all filters are at their default inactive values
- **THEN** the summary does not display any filter-clearing controls
- **AND** the summary still displays the item count and active sort order without an empty or misleading filter indicator

#### Scenario: Summary matches persisted local preferences
- **WHEN** list filter or sort preferences are restored from local storage
- **THEN** the summary reflects the restored active filters, sort field, and sort direction before the user changes them

### Requirement: Item details display audit metadata
The item detail UI SHALL display read-only update and creation metadata below the note field for the selected item in both editable and read-only modes.

#### Scenario: Audit metadata is visible below notes in edit mode
- **WHEN** an owner or editor opens an item detail page for an item with audit metadata
- **THEN** the editable detail view displays a centered `updated by` line below the note field with the item's updated timestamp and updating user
- **AND** the editable detail view displays a centered `created by` line below the updated line with the item's created timestamp and creating user

#### Scenario: Audit metadata is visible below notes in read-only mode
- **WHEN** a user opens an item detail view for an item with audit metadata
- **THEN** the read-only detail view displays a centered `updated by` line below the note field with the item's updated timestamp and updating user
- **AND** the read-only detail view displays a centered `created by` line below the updated line with the item's created timestamp and creating user

#### Scenario: Audit metadata uses requested display format
- **WHEN** the detail view renders item audit timestamps
- **THEN** each audit line is formatted in the app's English locale as `<weekday> <day>. <month> <year> at <hour>:<minute> <action> by <display name>`, for example `Fri. 8. May 26 at 14:07 created by User`
- **AND** each timestamp is calculated in the current user's persisted timezone
- **AND** each line displays the timestamp before the action and user label

#### Scenario: Audit metadata is read-only
- **WHEN** a user views item audit metadata
- **THEN** the created and updated values are not editable from the item detail UI
- **AND** saving other item fields does not send audit metadata values from the frontend request body

#### Scenario: Updated user is tracked by the item contract
- **WHEN** an item is created or changed by an authenticated editable user
- **THEN** item API responses and item SSE payloads include `updatedByUserId`
- **AND** `updatedByUserId` identifies the user who performed the latest item mutation

#### Scenario: Missing audit user is handled
- **WHEN** an item has an audit user ID that cannot be resolved to a visible list user
- **THEN** the detail view still displays the corresponding audit row
- **AND** the user portion displays `Deleted user`
- **AND** the raw audit user ID is not displayed

### Requirement: Backend authorization remains authoritative
Frontend capability handling SHALL complement and SHALL NOT replace the backend role checks on write endpoints.

#### Scenario: Unauthorized write request bypasses the UI
- **WHEN** a viewer directly invokes an item, category, list, or membership write endpoint
- **THEN** the backend continues to reject the request according to its existing minimum-role requirement
