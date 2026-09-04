## ADDED Requirements

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
