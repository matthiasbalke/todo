## MODIFIED Requirements

### Requirement: Frontend exposes list duplication from the list menu
The frontend SHALL expose duplication from the list options menu for users with list management capability, and the action SHALL be available again after a successful duplication flow completes.

#### Scenario: Owner sees duplicate action above delete
- **WHEN** an owner opens the list options menu
- **THEN** a `Duplicate list` action is shown directly above `Delete list`

#### Scenario: Duplicate action creates and opens the copy
- **WHEN** an owner activates `Duplicate list`
- **THEN** the frontend calls the duplicate list API operation
- **AND** the duplicated list is added to local list state
- **AND** the user is navigated to the duplicated list page

#### Scenario: Duplicated list can be duplicated again immediately
- **WHEN** an owner duplicates a list and arrives on the duplicated list page
- **THEN** the `Duplicate list` action is enabled without requiring the user to leave and reopen the list

#### Scenario: Duplicate failure is reported
- **WHEN** duplicating a list fails
- **THEN** the frontend leaves the user on the source list and reports a friendly error
