## MODIFIED Requirements

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
