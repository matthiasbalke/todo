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
- **THEN** the derived capabilities permit item mutation, category management, list management, and membership management

#### Scenario: Editor capabilities are derived
- **WHEN** the current user's list role is `EDITOR`
- **THEN** the derived capabilities permit item mutation and category management
- **AND** they do not permit list management or membership management

#### Scenario: Viewer capabilities are derived
- **WHEN** the current user's list role is `VIEWER`
- **THEN** the derived capabilities do not permit item mutation, category management, list management, or membership management

### Requirement: Backend authorization remains authoritative
Frontend capability handling SHALL complement and SHALL NOT replace the backend role checks on write endpoints.

#### Scenario: Unauthorized write request bypasses the UI
- **WHEN** a viewer directly invokes an item, category, list, or membership write endpoint
- **THEN** the backend continues to reject the request according to its existing minimum-role requirement
