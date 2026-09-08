## MODIFIED Requirements

### Requirement: Viewer item details are read-only
The item detail route SHALL render item information without mutation controls when the current user cannot edit items, using disabled versions of the normal item-detail form controls and the normal item-detail field order.

#### Scenario: Viewer opens item details
- **WHEN** a viewer opens an item's detail route
- **THEN** the title field and starred indicator are presented as read-only information in a single row, in that order
- **AND** category, due date, recurrence, assignments, and notes are presented after the title row as disabled regular item-detail controls in that order
- **AND** the read-only item detail content uses the same single-column field layout as the editable form after the title row
- **AND** audit metadata is presented below notes in the same placement as the editable form
- **AND** no completion or status indicator is displayed
- **AND** no save or delete action is available

#### Scenario: Editor opens item details
- **WHEN** an owner or editor opens an item's detail route
- **THEN** the existing editable form and delete action remain available
