## ADDED Requirements

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
