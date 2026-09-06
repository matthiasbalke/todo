## MODIFIED Requirements

### Requirement: Today includes assigned due and overdue items
The Today query SHALL include an item when the current user has at least viewer membership in its source list, its due date is on or before the current calendar date in the user's persisted timezone, and either the current user is assigned to it or the source list has exactly one member and the item is unassigned.

#### Scenario: Assigned item is due today
- **WHEN** an item is assigned to the current user and its due date equals the user's current calendar date
- **THEN** the item is included in Today

#### Scenario: Assigned item is overdue
- **WHEN** an item is assigned to the current user and its due date is before the user's current calendar date
- **THEN** the item is included in Today

#### Scenario: Unassigned item in a single-member list is due today
- **WHEN** an item is unassigned, belongs to a list with exactly one member, and its due date equals that member's current calendar date
- **THEN** the item is included in Today for that member

#### Scenario: Unassigned item in a single-member list is overdue
- **WHEN** an item is unassigned, belongs to a list with exactly one member, and its due date is before that member's current calendar date
- **THEN** the item is included in Today for that member

#### Scenario: Unassigned item in a multi-member list does not qualify
- **WHEN** an item is unassigned and belongs to a list with more than one member
- **THEN** the item is excluded from Today for every member

#### Scenario: Item does not qualify
- **WHEN** an item is assigned only to another user, undated, due in the future, or belongs to a list the current user cannot read
- **THEN** the item is excluded from Today

#### Scenario: Users are in different timezones
- **WHEN** the same instant falls on different calendar dates in two users' persisted timezones
- **THEN** each user's Today qualification uses that user's local calendar date
