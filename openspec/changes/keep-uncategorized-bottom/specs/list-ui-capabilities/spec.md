## ADDED Requirements

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
