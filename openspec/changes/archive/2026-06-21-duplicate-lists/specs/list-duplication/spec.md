## ADDED Requirements

### Requirement: Owners can duplicate a list
The system SHALL allow a list owner to duplicate an existing list through a dedicated list API operation.

#### Scenario: Owner duplicates a list
- **WHEN** an authenticated owner duplicates a list
- **THEN** the system creates a new list and returns its list details
- **AND** the authenticated owner is an owner of the new list

#### Scenario: Non-owner duplicates a list
- **WHEN** an authenticated editor or viewer attempts to duplicate a list
- **THEN** the backend rejects the request according to owner-only list management authorization

#### Scenario: Non-member duplicates a list
- **WHEN** an authenticated user without list membership attempts to duplicate a list
- **THEN** the backend rejects the request without exposing the source list contents

### Requirement: Duplicate list names use the next numeric suffix
The duplicated list SHALL receive the source list base name plus the next available numeric suffix for the requesting user's accessible lists. If the source list already ends with a numeric copy suffix like ` (1)`, the suffix SHALL be removed before choosing the next number.

#### Scenario: First duplicate is named with suffix one
- **WHEN** a user duplicates a list named `Groceries` and no accessible list named `Groceries (1)` exists for that user
- **THEN** the new list is named `Groceries (1)`

#### Scenario: Duplicate name skips existing suffixes
- **WHEN** a user duplicates a list named `Groceries` and accessible lists named `Groceries (1)` and `Groceries (2)` already exist for that user
- **THEN** the new list is named `Groceries (3)`

#### Scenario: Duplicating an existing copy increments the base name suffix
- **WHEN** a user duplicates a list named `Groceries (1)` and an accessible list named `Groceries` already exists for that user
- **THEN** the new list is named `Groceries (2)`

### Requirement: Duplicate list preserves source list data
The duplicate SHALL copy the source list metadata, categories, memberships, items, and item assignments while generating new identifiers for the duplicated list, categories, and items.

#### Scenario: List metadata is copied
- **WHEN** a list is duplicated
- **THEN** the duplicate has the source list emoji, description, default sort field, and default sort direction
- **AND** the duplicate has a newly generated list identifier and creation timestamp

#### Scenario: Categories are copied
- **WHEN** a list with categories is duplicated
- **THEN** each duplicate category has the source category name, color, and sort order
- **AND** each duplicate category belongs to the duplicate list with a newly generated category identifier

#### Scenario: Items are copied with equivalent fields
- **WHEN** a list with items is duplicated
- **THEN** each duplicate item has the source item title, notes, done state, starred state, due date, recurrence rule, parent item relationship, created-by user, sort order, and assigned users
- **AND** each duplicate item belongs to the duplicate list with a newly generated item identifier

#### Scenario: Item categories point at duplicated categories
- **WHEN** an item assigned to a source category is duplicated
- **THEN** the duplicate item references the matching duplicated category

#### Scenario: Item parent relationships point at duplicated items
- **WHEN** an item whose parent item is also in the source list is duplicated
- **THEN** the duplicate item references the matching duplicated parent item

### Requirement: Frontend exposes list duplication from the list menu
The frontend SHALL expose duplication from the list options menu for users with list management capability.

#### Scenario: Owner sees duplicate action above delete
- **WHEN** an owner opens the list options menu
- **THEN** a `Duplicate list` action is shown directly above `Delete list`

#### Scenario: Duplicate action creates and opens the copy
- **WHEN** an owner activates `Duplicate list`
- **THEN** the frontend calls the duplicate list API operation
- **AND** the duplicated list is added to local list state
- **AND** the user is navigated to the duplicated list page

#### Scenario: Duplicate failure is reported
- **WHEN** duplicating a list fails
- **THEN** the frontend leaves the user on the source list and reports a friendly error
