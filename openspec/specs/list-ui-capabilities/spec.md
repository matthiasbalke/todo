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

### Requirement: Backend authorization remains authoritative
Frontend capability handling SHALL complement and SHALL NOT replace the backend role checks on write endpoints.

#### Scenario: Unauthorized write request bypasses the UI
- **WHEN** a viewer directly invokes an item, category, list, or membership write endpoint
- **THEN** the backend continues to reject the request according to its existing minimum-role requirement
