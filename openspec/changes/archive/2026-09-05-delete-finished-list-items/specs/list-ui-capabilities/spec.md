## ADDED Requirements

### Requirement: Item mutation capability includes checked-item cleanup
The frontend SHALL treat list-level checked-item cleanup in real list views as an item mutation capability.

#### Scenario: Editable user sees cleanup action
- **WHEN** the current user's list role is `OWNER` or `EDITOR`
- **THEN** the regular list and grocery list options menus expose the delete-checked-items action

#### Scenario: Editable user sees disabled cleanup action without checked items
- **WHEN** the current user's list role is `OWNER` or `EDITOR` and the real list has no checked items
- **THEN** the regular list and grocery list options menus display the delete-checked-items action disabled

#### Scenario: Viewer does not see cleanup action
- **WHEN** the current user's list role is `VIEWER`
- **THEN** regular list and grocery list options menus do not expose the delete-checked-items action

#### Scenario: Cleanup action follows item mutation capability
- **WHEN** the shared capability mapping says a user cannot edit items
- **THEN** presentation components do not independently re-enable checked-item cleanup through separate role checks
