## ADDED Requirements

### Requirement: Regular list assignment filters support multiple criteria
The regular list view SHALL allow users to select multiple assignment filter criteria at the same time and SHALL include an item when it matches any selected assignment criterion while still applying all other active filter categories.

#### Scenario: Assigned to me and unassigned are combined
- **WHEN** a user selects both `Assigned to me` and `Not assigned` in a regular list view
- **THEN** the visible items include items assigned to the current user
- **AND** the visible items include items with no assigned users
- **AND** the visible items exclude items assigned only to other users

#### Scenario: Other filter categories still narrow combined assignment results
- **WHEN** a user selects multiple assignment criteria and also enables another filter such as `Starred only`, `Hide future`, `Has due date`, or `Hide checked`
- **THEN** an item is visible only when it matches at least one selected assignment criterion and satisfies every other active filter category

#### Scenario: Clearing assignment filters restores all-assignee matching
- **WHEN** a user clears the active assignment filter from the list state summary
- **THEN** assignment no longer restricts the visible items
- **AND** other active filters, sort field, and sort direction remain unchanged

#### Scenario: Combined assignment filters persist per list
- **WHEN** a user selects multiple assignment criteria for a regular list and later reopens that list
- **THEN** the same assignment criteria are restored for that list
- **AND** the active filter summary shows the restored assignment filter state
