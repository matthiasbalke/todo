## ADDED Requirements

### Requirement: Editable users can sort category groups in the list view
The standard list view SHALL allow users with category management capability to reorder real category groups by drag and drop.

#### Scenario: Category group order is changed in list view
- **WHEN** an editable user drags a real category group to a different position in the standard list view
- **THEN** the displayed real category groups are reordered to match the dropped position
- **AND** the category order is persisted for subsequent loads of the list

#### Scenario: Items remain inside their groups
- **WHEN** an editable user reorders category groups in the standard list view
- **THEN** each item remains assigned to its original category or uncategorized group
- **AND** each group's item order remains unchanged

#### Scenario: Uncategorized group remains at bottom
- **WHEN** the uncategorized group is visible and an editable user reorders category groups in the standard list view
- **THEN** only real category groups are repositioned
- **AND** the uncategorized group remains displayed after all real category groups

#### Scenario: Existing item dragging remains available
- **WHEN** manual item dragging is active and an editable user reorders or moves items within category groups
- **THEN** item drag handles and item drop behavior continue to work independently from category group dragging

#### Scenario: Viewer cannot sort category groups
- **WHEN** a viewer opens a list grouped by category
- **THEN** category group drag handles and group drop targets are not available
- **AND** the viewer cannot persist category group order changes through the UI
